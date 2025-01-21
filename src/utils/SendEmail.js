const nodemailer = require('nodemailer');
require("dotenv").config();

/**
 * Sends an email using the provided SMTP credentials and email details.
 *
 * @param {Object} smtpCredentials - SMTP credentials containing smtpMail and smtpPassword.
 * @param {Object} emailDetails - Email details including email, subject, body, and attachmentUrl.
 * @returns {Promise<void>} Resolves if the email is sent successfully, otherwise throws an error.
 */
async function sendEmail(smtpCredentials, emailDetails) {
  try {
    // Validate SMTP credentials
    if (!smtpCredentials?.smtpMail || !smtpCredentials?.smtpPassword) {
      throw new Error('Missing SMTP credentials. Please provide smtpMail and smtpPassword.');
    }

    // Validate email details
    if (!emailDetails?.email) {
      throw new Error('Recipient email address is required.');
    }
    if (!emailDetails?.subject) {
      throw new Error('Email subject is required.');
    }
    if (!emailDetails?.body) {
      throw new Error('Email body is required.');
    }

    // Create the transporter
    const transporter = nodemailer.createTransport({
      host: process.env.smtpHost || 'smtp.gmail.com', // Replace with a fallback if necessary
      port: process.env.smtpPort || 587, // Default to 587 if not set
      auth: {
        user: smtpCredentials.smtpMail,
        pass: smtpCredentials.smtpPassword,
      },
    });

    // Verify the transporter connection
    await transporter.verify();

    // Prepare attachments if both fileName and attachmentUrl are provided
    const attachments = emailDetails.fileName && emailDetails.attachmentUrl ? [{
      filename: emailDetails.fileName,
      path: emailDetails.attachmentUrl
    }] : [];

    // Send the email
    await transporter.sendMail({
      from: smtpCredentials.smtpMail,
      to: emailDetails.email,
      subject: emailDetails.subject,
      html: emailDetails.body,
      attachments, // Send attachments only if valid fileName and attachmentUrl are provided
    });

    console.log(`Email sent successfully to ${emailDetails.email}`);
  } catch (error) {
    console.error('Error while sending email:', error.message);

    // Re-throw the error to notify the caller
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Export the function
module.exports = {
  sendEmail,
};
