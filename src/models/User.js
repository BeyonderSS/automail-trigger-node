const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    clerkUserId: { type: String, required: true, unique: true }, // Clerk user ID field
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = User;
