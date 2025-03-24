import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error("⚠️ Please define the MONGODB_URI environment variable in your .env file");
}

// Global cache for the database connection (to prevent multiple connections in serverless environments)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    console.log("✅ Using cached database connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("🌐 Creating new database connection...");
    const opts = { bufferCommands: false };

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
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default dbConnect;
