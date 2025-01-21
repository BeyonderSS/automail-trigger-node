const EmailQueue = require('../models/EmailQueue');
const Loop = require('../models/Loop');
const User = require('../models/User');
const DocumentGallery = require('../models/DocumentGallery');

// Create Operations
const createDocument = async (data) => {
  try {
    const document = new DocumentGallery(data);
    return await document.save();
  } catch (error) {
    return { error: `Error creating document: ${error.message}` };
  }
};

const createUser = async (data) => {
  try {
    const user = new User(data);
    return await user.save();
  } catch (error) {
    return { error: `Error creating user: ${error.message}` };
  }
};

const createEmailQueue = async (data) => {
  try {
    const emailQueue = new EmailQueue(data);
    return await emailQueue.save();
  } catch (error) {
    return { error: `Error creating email queue: ${error.message}` };
  }
};

const createLoop = async (data) => {
  try {
    const loop = new Loop(data);
    return await loop.save();
  } catch (error) {
    return { error: `Error creating loop: ${error.message}` };
  }
};

// Read Operations
const getUserByClerkId = async (clerkUserId) => {
  try {
    const user = await User.findOne({ clerkUserId });
    if (!user) return { error: 'User not found' };
    return user;
  } catch (error) {
    return { error: `Error fetching user: ${error.message}` };
  }
};

const getPendingLoops = async () => {
  try {
    const loops = await Loop.find({ status: 'pending' }).populate('emails');
    if (!loops.length) return { error: 'No pending loops found' };
    return loops;
  } catch (error) {
    return { error: `Error fetching pending loops: ${error.message}` };
  }
};

const getEmailQueueByLoopId = async (loopId) => {
  try {
    const emailQueue = await EmailQueue.find({ loop: loopId });
    if (!emailQueue.length) return { error: 'No emails found for this loop' };
    return emailQueue;
  } catch (error) {
    return { error: `Error fetching email queue for loop: ${error.message}` };
  }
};

const getDocumentById = async (id) => {
  try {
    const document = await DocumentGallery.findById(id);
    if (!document) return { error: 'Document not found' };
    return document;
  } catch (error) {
    return { error: `Error fetching document: ${error.message}` };
  }
};

// Update Operations
const updateLoopStatus = async (loopId, status, additionalFields = {}) => {
  try {
    const updatedLoop = await Loop.findByIdAndUpdate(
      loopId,
      { status, ...additionalFields },
      { new: true }
    );
    if (!updatedLoop) return { error: 'Loop not found or update failed' };
    return updatedLoop;
  } catch (error) {
    return { error: `Error updating loop status: ${error.message}` };
  }
};

const updateEmailStatus = async (emailId, status, errorMessage = null) => {
  try {
    const updatedEmail = await EmailQueue.findByIdAndUpdate(
      emailId,
      { status, errorMessage },
      { new: true }
    );
    if (!updatedEmail) return { error: 'Email not found or update failed' };
    return updatedEmail;
  } catch (error) {
    return { error: `Error updating email status: ${error.message}` };
  }
};

// Delete Operations
const deleteDocumentById = async (id) => {
  try {
    const deletedDocument = await DocumentGallery.findByIdAndDelete(id);
    if (!deletedDocument) return { error: 'Document not found or delete failed' };
    return deletedDocument;
  } catch (error) {
    return { error: `Error deleting document: ${error.message}` };
  }
};

const deleteEmailQueueById = async (id) => {
  try {
    const deletedEmailQueue = await EmailQueue.findByIdAndDelete(id);
    if (!deletedEmailQueue) return { error: 'Email queue not found or delete failed' };
    return deletedEmailQueue;
  } catch (error) {
    return { error: `Error deleting email queue: ${error.message}` };
  }
};

const deleteLoopById = async (id) => {
  try {
    const deletedLoop = await Loop.findByIdAndDelete(id);
    if (!deletedLoop) return { error: 'Loop not found or delete failed' };
    return deletedLoop;
  } catch (error) {
    return { error: `Error deleting loop: ${error.message}` };
  }
};

module.exports = {
  createDocument,
  createUser,
  createEmailQueue,
  createLoop,
  getUserByClerkId,
  getPendingLoops,
  getEmailQueueByLoopId,
  getDocumentById,
  updateLoopStatus,
  updateEmailStatus,
  deleteDocumentById,
  deleteEmailQueueById,
  deleteLoopById,
};
