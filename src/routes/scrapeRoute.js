import "dotenv/config";
import express from "express";
import fs from "fs";
import puppeteer from "puppeteer";
import { InferenceClient } from "@huggingface/inference";
import { Parser } from "json2csv";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Utility for handling __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sessionPath = path.join(__dirname, "session.json");

// Load LinkedIn session from a file
const loadSession = () => {
    try {
        return JSON.parse(fs.readFileSync(sessionPath, "utf8"));
    } catch (err) {
        console.error("Session file not found or invalid. User login required.");
        return null;
    }
};

// Save LinkedIn session to a file
const saveSession = async (page) => {
    const cookies = await page.cookies();
    fs.writeFileSync(sessionPath, JSON.stringify({ cookies }, null, 2));
    console.log("Session saved successfully.");
};

// Initialize Hugging Face AI Client
const client = new InferenceClient(process.env.HGFTOKEN);

// Function to launch Puppeteer for user login
const launchLoginBrowser = async () => {
    console.log("Launching browser for LinkedIn login...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://www.linkedin.com/login", { waitUntil: "networkidle2" });

    console.log("Please log in manually. After logging in, press Enter in the terminal.");
    await new Promise((resolve) => process.stdin.once("data", resolve));

    await saveSession(page);
    await browser.close();
    console.log("Session saved. Restarting scraping process...");
};

// LinkedIn Scraper Streaming Endpoint
router.post("/scrapeLinkedInPostsData", async (req, res) => {
    const { searchQuery, prompt, minEntries, maxEntries } = req.body;
    if (!searchQuery || !prompt || !minEntries || !maxEntries) {
        return res.status(400).json({ error: "Missing required parameters." });
    }

    let session = loadSession();
    if (!session) {
        await launchLoginBrowser();
        session = loadSession();
        if (!session) return res.status(500).json({ error: "Failed to retrieve LinkedIn session after login." });
    }

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setCookie(...session.cookies);

    try {
        const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(searchQuery)}`;
        await page.goto(searchUrl, { waitUntil: "networkidle2" });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Transfer-Encoding", "chunked");
        res.write("name,title,company,email,description\n");

        let collectedEntries = 0;
        while (collectedEntries < maxEntries) {
            await page.evaluate(async () => {
                window.scrollBy(0, 500);
                await new Promise((resolve) => setTimeout(resolve, 2000));
            });

            let pageContent = await page.content();

            let aiResponse = await client.chatCompletion({
                provider: "hf-inference",
                model: "Qwen/Qwen2.5-VL-7B-Instruct",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Extract job posts with recruiter name, title, company, email, job description from this HTML." },
                            { type: "text", text: pageContent },
                        ],
                    },
                ],
                max_tokens: 1000,
            });

            let jobPosts = JSON.parse(aiResponse.choices[0].message.text);
            for (let post of jobPosts) {
                if (collectedEntries >= maxEntries) break;
                res.write(`${post.name},${post.title},${post.company},${post.email},${post.description}\n`);
                collectedEntries++;
            }

            if (collectedEntries >= minEntries) break;
        }

        await browser.close();
        res.end();
    } catch (error) {
        console.error("Error scraping LinkedIn", error);
        await browser.close();
        res.status(500).json({ error: "Failed to scrape LinkedIn" });
    }
});

export default router;
