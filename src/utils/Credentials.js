const { clerkClient } = require("@clerk/express");

async function getUserMetadata(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    // Fetch user data from Clerk using the user ID
    const user = await clerkClient.users.getUser(userId);

    // Access and return private metadata
    const privateMetadata = user.privateMetadata || {};

    return {
      success: true,
      data: {
        smtpMail: privateMetadata.smtpMail || null,
        smtpPassword: privateMetadata.smtpPassword || null,
        huggingfaceToken: privateMetadata.huggingfaceToken || null,
        uploadThingToken: privateMetadata.uploadThingToken || null,
      },
    };
  } catch (error) {
    console.error("Error fetching user metadata:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { getUserMetadata };
