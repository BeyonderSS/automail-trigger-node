const { getUserMetadata } = require('../utils/Credentials');
const { sendEmail } = require('../utils/SendEmail');
const Loop = require('../models/Loop');
const EmailQueue = require('../models/EmailQueue');
const User = require('../models/User');
const DocumentGallery = require('../models/DocumentGallery');

const processPendingLoops = async (loopId = null) => {
  try {
    console.log('%c[PROCESS] Fetching loops to process...', 'color: green; font-weight: bold;');

    // Fetch loops: either by specific loopId or all "in-progress" loops
    const query = loopId ? { _id: loopId } : { status: 'in-progress' };
    const loops = await Loop.find(query).populate({
      path: 'emails'
    }).catch((err) => {
      console.error('%c[ERROR] Error fetching loops:', 'color: red;', err.message);
      throw new Error('Failed to fetch loops');
    });

    if (!loops || loops.length === 0) {
      console.log('%c[INFO] No loops found to process.', 'color: blue;');
      return;
    }

    for (let loop of loops) {
      try {
         // Update loop status to "in-progress" if loopId is provided
         if (loopId) {
          await Loop.findByIdAndUpdate(loop._id, { status: 'in-progress' });
          console.log(`%c[INFO] Loop ${loop._id} status updated to "in-progress".`, 'color: blue;');
        }

        console.log(`%c[PROCESS] Processing loop ${loop._id}...`, 'color: orange; font-weight: bold;');

        const loopStartTime = Date.now();

        // Filter pending email docs
        const emails = loop.emails.filter((email) => email.status === 'pending');
        if (!emails || emails.length === 0) {
          console.warn(`%c[WARN] No pending emails found in loop ${loop._id}. Skipping...`, 'color: yellow;');
          continue;
        }

        // Fetch user details
        const user = await User.findById(loop.userId).catch((err) => {
          console.error(`%c[ERROR] Error fetching user for loop ${loop._id}:`, 'color: red;', err.message);
          throw new Error(`Failed to fetch user for loop ${loop._id}`);
        });

        if (!user) {
          console.warn(`%c[WARN] User not found for loop ${loop._id}. Skipping...`, 'color: yellow;');
          continue;
        }

        console.log(`%c[INFO] User details for loop ${loop._id}:`, 'color: blue;', {
          userId: user._id,
          clerkUserId: user.clerkUserId,
        });

        // Fetch user SMTP credentials
        const { success, data, error } = await getUserMetadata(user.clerkUserId).catch((err) => {
          console.error(`%c[ERROR] Error fetching metadata for user ${user._id}:`, 'color: red;', err.message);
          throw new Error(`Failed to fetch metadata for user ${user._id}`);
        });

        if (!success || !data) {
          console.warn(`%c[WARN] Invalid SMTP credentials for user ${user._id}. Skipping...`, 'color: yellow;');
          continue;
        }

        const smtpCredentials = {
          smtpMail: data.smtpMail,
          smtpPassword: data.smtpPassword,
        };

        if (!smtpCredentials.smtpMail || !smtpCredentials.smtpPassword) {
          console.warn(`%c[WARN] Missing SMTP credentials for user ${user._id}. Skipping...`, 'color: yellow;');
          continue;
        }

        let sentEmailsCount = 0;
        let failedEmailsCount = 0;

        for (let i = 0; i < emails.length; i++) {
          const emailDoc = emails[i];
          const documentGallery = await DocumentGallery.findById(emailDoc.documentGallary);
          if (!documentGallery) {
            console.warn(`%c[WARN] DocumentGallery not found for email ${emailDoc._id}.`, 'color: yellow;');
          }
          
          const emailDetails = {
            email: emailDoc.email,
            subject: emailDoc.subject,
            body: emailDoc.body,
            fileName: documentGallery ? documentGallery.title : null,
            attachmentUrl: documentGallery ? documentGallery.url : null, // Use URL if available, else null
          };
          
          console.log(`%c[INFO] Email details for loop ${loop._id}, email ${emailDoc._id}:`, 'color: purple;', emailDetails);
          
          try {
            console.log(`%c[PROCESS] Sending email to ${emailDoc.email}...`, 'color: orange; font-weight: bold;');
            await sendEmail(smtpCredentials, emailDetails).catch((err) => {
              console.error(`%c[ERROR] Error sending email to ${emailDoc.email}:`, 'color: red;', err.message);
              throw new Error(`Failed to send email to ${emailDoc.email}`);
            });

            // Update email status as "completed" and set "sentAt"
            await EmailQueue.findByIdAndUpdate(emailDoc._id, {
              status: 'completed',
              sentAt: new Date(),
            });

            sentEmailsCount++;
            console.log(`%c[SUCCESS] Email sent successfully to ${emailDoc.email}`, 'color: green; font-weight: bold;');

            // Update loop.sentEmails after each email is sent
            await Loop.findByIdAndUpdate(loop._id, {
              sentEmails: loop.sentEmails + sentEmailsCount,
            });

          } catch (emailError) {
            console.error(`%c[ERROR] Error processing email ${emailDoc._id}:`, 'color: red;', emailError.message);

            // Update email status as "failed" with an error message
            await EmailQueue.findByIdAndUpdate(emailDoc._id, {
              status: 'failed',
              errorMessage: emailError.message,
            });

            failedEmailsCount++;
          }

          const progress = ((i + 1) / emails.length) * 100;
          console.log(`%c[PROGRESS] Loop ${loop._id}: ${progress.toFixed(2)}% completed.`, 'color: blue; font-weight: bold;');

          if (i < emails.length - 1) {
            console.log('%c[INFO] Waiting 2 minutes before sending the next email...', 'color: blue;');
            await new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000));
          }
        }

        // Update loop counters and status after processing all emails
        await Loop.findByIdAndUpdate(loop._id, {
          sentEmails: loop.sentEmails + sentEmailsCount,
          failedEmails: loop.failedEmails + failedEmailsCount,
          totalEmails: loop.totalEmails || emails.length,
          status: 'completed',
          completedAt: new Date(),
        });

        const loopEndTime = Date.now();
        const elapsedTime = ((loopEndTime - loopStartTime) / 1000).toFixed(2);
        console.log(`%c[SUCCESS] Loop ${loop._id} completed successfully in ${elapsedTime} seconds.`, 'color: green; font-weight: bold;');
      } catch (loopError) {
        console.error(`%c[ERROR] Error processing loop ${loop._id}:`, 'color: red;', loopError.message);

        // Mark loop as "failed"
        await Loop.findByIdAndUpdate(loop._id, { status: 'failed', errorMessage: loopError.message }).catch((err) => {
          console.error(`%c[ERROR] Error marking loop ${loop._id} as failed:`, 'color: red;', err.message);
        });
      }
    }
  } catch (error) {
    console.error('%c[CRITICAL] Critical error processing loops:', 'color: red; font-weight: bold;', error.message);
  }
};

module.exports = processPendingLoops;
