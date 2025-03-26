import "dotenv/config";
import express from "express";
import cron from "node-cron";
import https from "https"; // Built-in module for HTTP requests
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";

import dbConnect from "./config/dbConnect.js";
import loopRoutes from "./routes/loopRoutes.js";
import scrapeRoutes from "./routes/scrapeRoute.js";
import { readFile } from "fs/promises";
const config = JSON.parse(await readFile(new URL("../public/config.json", import.meta.url), "utf8"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

console.info(config.ascii);

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all origins
app.use(cors()); // This allows requests from any source

// Use the loop routes
app.use("/api/loops", loopRoutes);
// Use scraper routes
app.use("/api/scrape", scrapeRoutes);

// Function to initialize the database and start the server
dbConnect()
  .then(() => {
    console.log("✅ Database connected successfully");

    // Start the server
    app.listen(port, async () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    // Add your cron job here
    const pingUrl = "https://automail-trigger-node.onrender.com"; // Ping URL

    cron.schedule("*/10 * * * *", () => {
      const request = https.get(pingUrl, (res) => {
        console.log(`🔗 Ping successful: Status Code ${res.statusCode}`);
      });

      request.on("error", (err) => {
        console.error("❌ Error pinging URL:", err.message);
      });

      request.end(); // End the request
    });

    console.log("⏰ Cron job scheduled to ping every 10 minutes");
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });
