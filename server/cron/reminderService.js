const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { sendWhatsApp } = require('../utils/whatsapp');

dayjs.extend(utc);

/**
 * Calculate days until subscription expires using UTC
 * @param {Date} endDate - Subscription end date
 * @returns {number} - Days left (positive/negative/zero)
 */
const getDaysLeft = (endDate) => {
  const today = dayjs.utc().startOf('day');
  const expiryDate = dayjs.utc(endDate).startOf('day');
  return expiryDate.diff(today, 'day');
};

/**
 * Check if reminder should be sent for this milestone
 * @param {Object} subscription - Subscription document
 * @param {number} daysLeft - Days until expiry
 * @returns {boolean} - Should send reminder
 */
const shouldSendReminder = (subscription, daysLeft) => {
  // Check if reminder already sent for this milestone
  if (subscription.remindersSent && subscription.remindersSent.includes(daysLeft)) {
    return false;
  }

  // Milestones: 7, 3, 2, 1, 0, -1 days
  return [7, 3, 2, 1, 0, -1].includes(daysLeft);
};

/**
 * Send WhatsApp reminder and record in database
 * @param {Object} subscription - Subscription document with populated userId
 * @param {number} daysLeft - Days until expiry
 */
const sendReminderForSubscription = async (subscription, daysLeft) => {
  try {
    // Edge case: missing phone
    if (!subscription.phone) {
      console.log(`[SKIP] ${subscription._id} | No phone`);
      return;
    }

    // Edge case: missing endDate
    if (!subscription.endDate) {
      console.log(`[SKIP] ${subscription._id} | No endDate`);
      return;
    }

    // Check if already sent
    if (!shouldSendReminder(subscription, daysLeft)) {
      console.log(`[SKIP] ${subscription._id} | Already notified (day_${daysLeft})`);
      return;
    }

    // Send WhatsApp message
    const result = await sendWhatsApp(subscription.phone, subscription, daysLeft);

    if (result.success) {
      // Record reminder sent IMMEDIATELY after sending
      subscription.remindersSent.push(daysLeft);
      subscription.lastReminderSent = new Date();
      await subscription.save();

      console.log(`[WHATSAPP] RECORDED | ${subscription._id} | day_${daysLeft}`);
    } else {
      console.log(`[WHATSAPP] SEND_FAILED | ${subscription._id} | ${result.error}`);
    }
  } catch (error) {
    console.log(`[WHATSAPP] ERROR | ${subscription._id} | ${error.message}`);
  }
};

/**
 * Main cron job: runs daily at 10:50 PM to check all subscriptions
 */
const runReminderJob = async () => {
  try {
    const startTime = Date.now();
    const jobTime = dayjs.utc().format('YYYY-MM-DD HH:mm:ss UTC');

    console.log(`[CRON] Starting WhatsApp job at ${jobTime}`);

    // Fetch all active subscriptions with phone numbers
    const subscriptions = await Subscription.find({ 
      isActive: true,
      phone: { $exists: true, $ne: null }
    }).populate('userId');

    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const subscription of subscriptions) {
      try {
        processed++;

        // Calculate days left using UTC
        const daysLeft = getDaysLeft(subscription.endDate);

        // Check and send if needed (milestones: 7, 3, 2, 1, 0, -1 days)
        if (shouldSendReminder(subscription, daysLeft)) {
          await sendReminderForSubscription(subscription, daysLeft);
          sent++;
        } else {
          skipped++;
        }
      } catch (subError) {
        errors++;
        console.log(`[CRON] EXCEPTION | ${subscription._id} | ${subError.message}`);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[CRON] Daily Job | Processed: ${processed} | Sent: ${sent} | Skipped: ${skipped} | Errors: ${errors} | ${elapsed}ms`);
  } catch (error) {
    console.log(`[CRON] JOB_ERROR | ${error.message}`);
  }
};

/**
 * Initialize cron job - runs at 10:50 PM daily
 * Cron: '50 22 * * *' = every day at 22:50 (10:50 PM UTC)
 */
const initializeCronJobs = () => {
  console.log('[CRON] Initializing WhatsApp reminder job...');

  cron.schedule('50 22 * * *', runReminderJob);

  console.log('[CRON] ✅ WhatsApp job scheduled (runs daily at 22:50 UTC / 10:50 PM)');
};

module.exports = {
  initializeCronJobs,
  runReminderJob,
  getDaysLeft,
  shouldSendReminder
};
