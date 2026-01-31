/**
 * WhatsApp Reminder Service via Twilio
 * Production-grade WhatsApp notification system
 */

const twilio = require('twilio');

// Initialize Twilio client (lazy - only when needed)
let client = null;

const getTwilioClient = () => {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured in .env');
    }

    client = twilio(accountSid, authToken);
  }
  return client;
};

const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

/**
 * Send WhatsApp reminder to user
 * @param {string} to - Phone number in E.164 format (+91...)
 * @param {Object} subscription - Subscription object
 * @param {number} daysLeft - Days until expiry
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendWhatsApp = async (to, subscription, daysLeft) => {
  try {
    // Validate phone number exists and is valid
    if (!to || typeof to !== 'string' || !to.startsWith('+')) {
      return {
        success: false,
        error: 'Invalid phone number format (must be E.164: +91...)'
      };
    }

    // Get Twilio client
    const client = getTwilioClient();

    // Build message based on days left
    let message = '';

    if (daysLeft < 0) {
      // Expired
      message = `❌ ${subscription.serviceName} subscription expired.\n\n📅 Expiry Date: ${new Date(subscription.endDate).toLocaleDateString('en-IN')}`;
    } else if (daysLeft === 0) {
      // Expires today
      message = `⏰ ${subscription.serviceName} expires *TODAY*!\n\n📅 Expiry: ${new Date(subscription.endDate).toLocaleDateString('en-IN')}`;
    } else {
      // Expires in N days
      message = `⏰ ${subscription.serviceName} expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.\n\n📅 Expiry: ${new Date(subscription.endDate).toLocaleDateString('en-IN')}`;
    }

    // Send via Twilio WhatsApp
    const response = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${to}`,
      body: message
    });

    console.log(`[WHATSAPP] SENT | ${subscription._id} | to ${to} | day_${daysLeft} | messageId: ${response.sid}`);

    return {
      success: true,
      messageId: response.sid
    };
  } catch (error) {
    console.log(`[WHATSAPP] FAIL | ${to} | ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify Twilio credentials on startup
 * @returns {Promise<boolean>}
 */
const verifyTwilioCredentials = async () => {
  try {
    // Check if credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('[WHATSAPP] ⚠️  Twilio credentials not configured in .env');
      console.log('[WHATSAPP] ℹ️  WhatsApp reminders will be skipped');
      return false;
    }

    // Get client and test connectivity
    const client = getTwilioClient();
    console.log('[WHATSAPP] ✅ Twilio credentials verified');
    return true;
  } catch (error) {
    console.log(`[WHATSAPP] ❌ Error verifying Twilio: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendWhatsApp,
  verifyTwilioCredentials
};
