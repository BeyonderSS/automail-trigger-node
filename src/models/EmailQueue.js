const mongoose = require("mongoose");

const emailQueueSchema = new mongoose.Schema({
  email: { type: String, required: true }, // Email address
  dynamicFields: { type: Map, of: String }, // Dynamic fields from the CSV file
  subject: { type: String, required: true }, // Subject of the email
  body: { type: String, required: true }, // Email body with placeholders for dynamic fields
  documentGallary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DocumentGallery",
  }, // Reference to Document Gallery
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  }, // Email status
  errorMessage: { type: String, default: null }, // Error message if sending fails
  createdAt: { type: Date, default: Date.now }, // When the email was added to the queue
  sentAt: { type: Date }, // When the email was sent
});

const EmailQueue =
  mongoose.models.EmailQueue || mongoose.model("EmailQueue", emailQueueSchema);

module.exports = EmailQueue;
