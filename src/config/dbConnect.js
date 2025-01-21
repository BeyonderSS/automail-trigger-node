require("dotenv").config();
const mongoose = require("mongoose");

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.DATABASE_URL;

// Check if the environment variable is defined
if (!MONGODB_URI) {
  throw new Error("⚠️ Please define the MONGODB_URI environment variable in your .env file");
}

// Global cache for the database connection (to prevent multiple connections in serverless environments)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // If the connection is already established, return it
  if (cached.conn) {
    console.log("✅ Using cached database connection");
    return cached.conn;
  }

  // If no connection promise exists, create a new one
  if (!cached.promise) {
    console.log("🌐 Creating new database connection...");
    const opts = {
      bufferCommands: false, // Disable buffering; throws an error if the database isn't connected
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ Database connected successfully");
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ Database connection failed:", err.message);
        throw err;
      });
  }

  try {
    // Wait for the connection promise to resolve
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset cached promise if the connection fails
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = dbConnect;