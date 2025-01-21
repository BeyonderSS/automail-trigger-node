require("dotenv").config();
const express = require("express");
var cron = require("node-cron");
const config = require("../public/config.json");
const dbConnect = require("./config/dbConnect");
const loopRoutes = require("./routes/loopRoutes");
const cors = require("cors");  // Importing cors

const app = express();
const port = process.env.PORT || 8080;
console.info(config.ascii);

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all origins
app.use(cors());  // This allows requests from any source

// Use the loop routes
app.use('/api/loops', loopRoutes);

// Initialize the database connection
dbConnect()
  .then(() => {
    console.log("✅ Database connected successfully");
    // Start the server
    app.listen(port, async () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });
