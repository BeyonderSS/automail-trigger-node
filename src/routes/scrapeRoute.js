const express = require("express");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { InferenceClient } = require("@huggingface/inference");
const { Parser } = require("json2csv");
require("dotenv").config();

const router = express.Router();

// Load LinkedIn session from a file
const loadSession = () => {
    try {
        return JSON.parse(fs.readFileSync("session.json", "utf8"));
    } catch (err) {
        console.error("Failed to load session file", err);
        return null;
    }
};

// Initialize Hugging Face AI Client
const client = new InferenceClient(process.env.HGFTOKEN);

// LinkedIn Scraper Endpoint
router.post("/scrapeLinkedInPostsData", async (req, res) => {
    // Extract parameters from request body
    const { searchQuery, prompt } = req.body;
    if (!searchQuery || !prompt) {
        return res.status(400).json({ error: "Missing required parameters." });
    }

    // Load LinkedIn session data
    const session = loadSession();
    if (!session) {
        return res.status(500).json({ error: "LinkedIn session not found." });
    }

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setCookie(...session.cookies);

    try {
        // Open LinkedIn search page with the provided query
        const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(searchQuery)}`;
        await page.goto(searchUrl, { waitUntil: "networkidle2" });

        // Scroll the page in a human-like manner for 1 minute
        await page.evaluate(async () => {
            for (let i = 0; i < 60; i++) {
                window.scrollBy(0, 500);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        });

        // Retrieve HTML content of the search page after scrolling
        let pageContent = await page.content();
        
        // Send HTML to AI to identify post elements and "...more" buttons
        let aiResponse = await client.chatCompletion({
            provider: "hf-inference",
            model: "Qwen/Qwen2.5-VL-7B-Instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Identify LinkedIn post elements in this HTML and return the selectors for posts and '...more' buttons." },
                        { type: "text", text: pageContent },
                    ],
                },
            ],
            max_tokens: 500,
        });

        let postSelectors = JSON.parse(aiResponse.choices[0].message.text);

        // Click all "...more" buttons in a human-like manner
        await page.evaluate(async (postSelectors) => {
            let buttons = document.querySelectorAll(postSelectors.moreButton);
            for (let btn of buttons) {
                btn.click();
                await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay between clicks
            }
        }, postSelectors);

        // Retrieve updated HTML content after expanding posts
        pageContent = await page.content();

        // Send updated HTML to AI to extract job-related posts with emails and process images for contact details
        aiResponse = await client.chatCompletion({
            provider: "hf-inference",
            model: "Qwen/Qwen2.5-VL-7B-Instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Extract job posts with recruiter name, title, company, email, job description from this HTML. Also process any images in the posts for relevant text such as email addresses." },
                        { type: "text", text: pageContent },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        let jobPosts = JSON.parse(aiResponse.choices[0].message.text);

        // Convert extracted data into CSV format
        const fields = ["name", "title", "company", "email", "description"];
        const parser = new Parser({ fields });
        const csv = parser.parse(jobPosts);
        
        // Save the CSV file locally
        fs.writeFileSync("linkedin_jobs.csv", csv);

        // Close browser and send CSV file as a response
        await browser.close();
        res.download("linkedin_jobs.csv");
    } catch (error) {
        console.error("Error scraping LinkedIn", error);
        await browser.close();
        res.status(500).json({ error: "Failed to scrape LinkedIn" });
    }
});

// Export the router module
module.exports = router;
