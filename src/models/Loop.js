const mongoose = require("mongoose");

const loopSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Title of the loop
  description: { type: String }, // Description of the loop
  emails: [{ type: mongoose.Schema.Types.ObjectId, ref: "EmailQueue" }], // Reference to the email queue
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "failed"],
    default: "pending",
  }, // Loop status
  totalEmails: { type: Number, required: false }, // Total number of emails in the loop
  sentEmails: { type: Number, default: 0 }, // Number of emails successfully sent
  failedEmails: { type: Number, default: 0 }, // Number of emails failed
  createdAt: { type: Date, default: Date.now }, // When the loop was created
  completedAt: { type: Date }, // When the loop was completed
});

const Loop = mongoose.models.Loop || mongoose.model("Loop", loopSchema);

module.exports = Loop;
