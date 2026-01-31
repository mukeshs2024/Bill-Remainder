# Email Reminder System - Setup & Implementation Guide

## Overview

The Bill Remainder app now includes a **production-grade automated email reminder system** that sends subscription expiration notifications at specific intervals:

- **7 days before expiry** - Initial reminder
- **3 days before expiry** - Urgent reminder
- **2 days before expiry** - Critical reminder  
- **1 day before expiry** - Final warning
- **On expiry day (0 days)** - Subscription expired notice
- **1+ day after expiry (-1 days)** - Renewal required notice

## Architecture

### Components

1. **Email Service** (`/server/utils/emailService.js`)
   - Nodemailer configuration with Gmail
   - Professional HTML email templates
   - Error handling and logging

2. **Reminder Cron Job** (`/server/cron/reminderCron.js`)
   - Runs daily at **9:00 AM**
   - Scans all active subscriptions
   - Calculates days until expiry
   - Prevents duplicate emails via `lastNotified` tracking
   - Comprehensive console logging for debugging

3. **Updated Subscription Model** (`/server/models/Subscription.js`)
   - New field: `email` - user email for notifications
   - New field: `endDate` - subscription expiry date
   - New field: `lastNotified` - tracks which milestone (7, 3, 2, 1, 0, -1) was sent
   - Updated field: `lastReminderSent` - timestamp of last email

4. **Server Integration** (`/server/server.js`)
   - Initializes reminder cron on startup
   - Single call: `startReminderCron()`

## Setup Instructions

### Step 1: Gmail App Password Configuration

The system uses **Gmail App Password** (not your regular Gmail password) for security.

**Follow these steps:**

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** from the left menu
3. Enable **2-Step Verification** (if not already enabled)
4. Find **App passwords** in Security settings (requires 2FA)
5. Select "Mail" → "Windows Computer" (or your device)
6. Google generates a 16-character app password
7. Copy the password and paste it into `.env` file

### Step 2: Environment Variables

Update `/server/.env`:

```env
# Email Configuration (Gmail App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
```

**Example:**
```env
EMAIL_USER=demo.billreminder@gmail.com
EMAIL_PASS=rvdp juwx vxtx wswi
```

### Step 3: Subscription Model Update

When creating subscriptions, **both `startDate` and `endDate` are required**:

```javascript
{
  serviceName: "Netflix",
  amount: 499,
  category: "entertainment",
  startDate: "2024-01-01",
  endDate: "2024-01-31",  // NEW: Subscription expiry date
  billingCycle: "monthly",
  reminderDaysBefore: 3,
  paymentMethod: "credit card"
}
```

## How It Works

### Daily Cron Job Execution (9:00 AM)

1. **Fetch all active subscriptions** from database
2. **For each subscription:**
   - Calculate days remaining until `endDate`
   - Determine reminder milestone (7, 3, 2, 1, 0, -1)
   - Check if email was already sent at this milestone (`lastNotified`)
   - If NOT already sent:
     - Get user email from User collection
     - Generate appropriate email template
     - Send email via Nodemailer
     - Update `lastNotified` and `lastReminderSent`
3. **Log detailed execution** in console

### Duplicate Prevention Logic

The `lastNotified` field prevents sending duplicate emails:

- When email sent at 7 days: `lastNotified = 7`
- When email sent at 3 days: `lastNotified = 3` (replaces 7)
- System only sends if `lastNotified !== currentMilestone`

Example scenario:
- Jan 10: Subscription expires Jan 17
- **Jan 10, 9 AM:** 7 days remaining → Email sent, `lastNotified = 7`
- **Jan 11, 9 AM:** 6 days remaining → No milestone, skip
- **Jan 14, 9 AM:** 3 days remaining → Email sent, `lastNotified = 3`
- **Jan 15, 9 AM:** 2 days remaining → Email sent, `lastNotified = 2`

## Monitoring & Debugging

### Console Logs

The cron job produces detailed console logs for debugging:

```
[CRON] ========== Reminder Job Started ==========
[CRON] Processing 5 active subscriptions
[CRON] [Netflix] Days: 7 | Milestone: 7 | Email: reminder7Days | User: user@example.com
[CRON] [AWS] Days: 3 | Milestone: 3 | Email: reminder3Days | User: user@example.com
[CRON] Summary: 2 emails sent, 3 skipped (duplicate prevention)
[CRON] ========== Job Completed (245ms) ==========

[EMAIL] ✓ Sent reminder7Days to user@example.com for Netflix (MessageID: <123456@gmail.com>)
[EMAIL] ✓ Transporter ready - emails can be sent
```

### Testing the Cron Job

To test without waiting until 9 AM, modify `/server/cron/reminderCron.js`:

```javascript
// Schedule: '0 9 * * *' = 9:00 AM daily
// For testing every 10 minutes:
cron.schedule('*/10 * * * *', async () => {
  console.log('[CRON] Running reminder check (test mode)');
  // ... rest of code
});
```

Then restart server: `npm run dev`

## Email Templates

### Reminder - 7 Days
- Subject: `Netflix Renewal - 7 Days Remaining`
- Color: Gray (#333)
- Tone: Friendly reminder

### Reminder - 3 Days
- Subject: `⚠️ Netflix Renewal - 3 Days Left`
- Color: Orange (#d9534f)
- Tone: Urgent reminder

### Reminder - 1 Day
- Subject: `🚨 Netflix Renewal - 1 Day Left!`
- Color: Red (#c82333)
- Tone: Critical warning

### Expiration Notice
- Subject: `❌ Netflix - Subscription Expired`
- Color: Dark Red (#721c24)
- Tone: Action required

Each email includes:
- Service name
- Amount
- Expiry/expiration date
- Call-to-action
- Professional branding

## Database Schema

### Subscription Model

```javascript
{
  userId: ObjectId,           // Reference to User
  serviceName: String,        // "Netflix", "AWS", etc.
  amount: Number,             // 499, 1000, etc.
  category: String,           // "entertainment", "cloud", etc.
  startDate: Date,            // When subscription started
  endDate: Date,              // REQUIRED: When subscription expires
  email: String,              // REQUIRED: User email for notifications
  lastNotified: Number,       // 7, 3, 2, 1, 0, -1, or null
  lastReminderSent: Date,     // Timestamp of last email
  isActive: Boolean,          // true/false for active/inactive
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### Emails not being sent?

1. **Check environment variables:**
   ```bash
   # In /server/.env, verify:
   EMAIL_USER=xxx@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx  # 16 characters
   ```

2. **Verify Gmail App Password:**
   - https://myaccount.google.com/apppasswords
   - Regenerate if needed
   - Update .env

3. **Check MongoDB connection:**
   - Verify subscriptions exist in database
   - Confirm `endDate` is set

4. **Review console logs:**
   - Look for `[CRON]` and `[EMAIL]` messages
   - Check for error messages

### Duplicate emails being sent?

- Check `lastNotified` field in subscription
- Verify cron job is running at correct time
- Clear `lastNotified` to reset tracking: 
  ```javascript
  db.subscriptions.updateOne(
    { _id: ObjectId("...") },
    { $set: { lastNotified: null } }
  )
  ```

### Cron job not running?

1. Verify server is running: `npm run dev`
2. Check console output for `[CRON] ✓ Reminder job scheduled`
3. Verify `node-cron` is installed: `npm list node-cron`
4. Check system time matches expected cron time

## Production Deployment Checklist

- [ ] Gmail App Password configured in .env (not regular password!)
- [ ] `endDate` added to all subscriptions in database
- [ ] `email` field populated for all users
- [ ] `lastNotified` field initialized to null for all subscriptions
- [ ] Server running with `startReminderCron()` called
- [ ] Test email sent successfully to admin account
- [ ] Console logs verified in production logs
- [ ] Error monitoring configured (Sentry, LogRocket, etc.)
- [ ] Backup .env file in secure location
- [ ] Rate limiting considered for high volume

## Future Enhancements

1. **SMS Notifications** - Add Twilio integration
2. **Push Notifications** - Add Firebase Cloud Messaging
3. **Email Customization** - Allow users to customize templates
4. **Reminder Frequency** - Let users choose reminder timing
5. **Webhook Integration** - Notify third-party services
6. **Analytics** - Track email delivery and open rates
7. **Retry Logic** - Automatic retry for failed emails
8. **Queue System** - Use Bull/RabbitMQ for scalability

## Support

For issues or questions:
1. Check console logs for `[CRON]` and `[EMAIL]` messages
2. Review .env configuration
3. Verify MongoDB subscriptions have endDate
4. Test Gmail App Password at https://myaccount.google.com/apppasswords
