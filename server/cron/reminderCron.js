const cron = require('node-cron');
const { sendReminderEmail } = require('../utils/emailService');

/**
 * Calculate days remaining until subscription expiry
 * @param {Date} endDate - Subscription end date
 * @returns {Number} - Days remaining (negative if expired)
 */
const calculateDaysRemaining = (endDate) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  return Math.floor((end - now) / (1000 * 60 * 60 * 24));
};

/**
 * Determine which reminder should be sent based on days remaining
 * Returns milestone number (7, 3, 2, 1, 0, -1) or null if no reminder needed
 */
const getReminderMilestone = (daysRemaining) => {
  if (daysRemaining === 7) return 7;
  if (daysRemaining === 3) return 3;
  if (daysRemaining === 2) return 2;
  if (daysRemaining === 1) return 1;
  if (daysRemaining === 0) return 0; // Today is expiry day
  if (daysRemaining === -1) return -1; // Day after expiry
  return null;
};

/**
 * Get email type based on days remaining
 */
const getEmailType = (daysRemaining) => {
  switch (daysRemaining) {
    case 7:
      return 'reminder7Days';
    case 3:
      return 'reminder3Days';
    case 2:
    case 1:
      return 'reminder1Day';
    case 0:
    case -1:
      return 'reminderExpiring';
    default:
      return null;
  }
};

/**
 * Main reminder job - runs daily at 9 AM
 */
const startReminderCron = () => {
  // Schedule: 0 9 * * * = 9:00 AM every day
  const job = cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] ========== Reminder Job Started ==========');
    const startTime = Date.now();

    try {
      const { Subscription, User } = global;

      // Verify models are loaded
      if (!Subscription || !User) {
        console.error('[CRON] Models not loaded - check server initialization');
        return;
      }

      // Fetch all active subscriptions
      const subscriptions = await Subscription.find({ isActive: true });

      if (subscriptions.length === 0) {
        console.log('[CRON] No active subscriptions found');
        console.log(`[CRON] ========== Job Completed (${Date.now() - startTime}ms) ==========\n`);
        return;
      }

      console.log(`[CRON] Processing ${subscriptions.length} active subscriptions`);

      let emailsSent = 0;
      let skippedCount = 0;

      for (const subscription of subscriptions) {
        const daysRemaining = calculateDaysRemaining(subscription.endDate);
        const milestone = getReminderMilestone(daysRemaining);

        // Skip if no reminder needed
        if (milestone === null) {
          continue;
        }

        // Skip if already notified at this milestone
        if (subscription.lastNotified === milestone) {
          skippedCount++;
          continue;
        }

        // Fetch user email
        const user = await User.findById(subscription.userId);
        if (!user || !user.email) {
          console.warn(`[CRON] User not found for subscription ${subscription._id}`);
          continue;
        }

        // Get email type and send
        const emailType = getEmailType(daysRemaining);
        if (!emailType) continue;

        // Add user email to subscription object for email template
        subscription.email = user.email;

        const emailResult = await sendReminderEmail(subscription, emailType);

        if (emailResult.success) {
          // Update lastNotified to prevent duplicate emails
          subscription.lastNotified = milestone;
          subscription.lastReminderSent = new Date();
          await subscription.save();

          emailsSent++;

          console.log(`[CRON] [${subscription.serviceName}] Days: ${daysRemaining} | Milestone: ${milestone} | Email: ${emailType} | User: ${user.email}`);
        } else {
          console.error(`[CRON] Failed to send email for ${subscription.serviceName}: ${emailResult.error}`);
        }
      }

      console.log(`[CRON] Summary: ${emailsSent} emails sent, ${skippedCount} skipped (duplicate prevention)`);
      console.log(`[CRON] ========== Job Completed (${Date.now() - startTime}ms) ==========\n`);
    } catch (error) {
      console.error('[CRON] Job failed:', error.message);
      console.log(`[CRON] ========== Job Failed (${Date.now() - startTime}ms) ==========\n`);
    }
  });

  console.log('[CRON] ✓ Reminder job scheduled for 9:00 AM daily');
  return job;
};

module.exports = {
  startReminderCron
};
