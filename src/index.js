require("dotenv").config();
const express = require("express");
var cron = require("node-cron");
const https = require("https"); // Built-in module for HTTP requests
const config = require("../public/config.json");
const dbConnect = require("./config/dbConnect");
const loopRoutes = require("./routes/loopRoutes");
const cors = require("cors"); // Importing cors
const scrapeRoutes = require("./routes/scrapeRoutes");
const app = express();
const port = process.env.PORT || 8080;
console.info(config.ascii);

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all origins
app.use(cors()); // This allows requests from any source

// Use the loop routes
app.use('/api/loops', loopRoutes);
// use scraper routes
app.use('/api/scrape',scrapeRoutes);

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
