const mongoose = require("mongoose");

const documentGallerySchema = new mongoose.Schema({
  title: { type: String, required: true }, // Title of the document
  url: { type: String, required: true }, // URL of the document
  fileKey: { type: String, required: true }, // Unique key for the file
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User
});

const DocumentGallery =
  mongoose.models.DocumentGallery ||
  mongoose.model("DocumentGallery", documentGallerySchema);

module.exports = DocumentGallery;
