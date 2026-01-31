# Complete End-to-End Testing Guide

## Quick Start (5 minutes)

### 1. Start the Server
```bash
cd server
npm run dev
```

**Expected output:**
```
✅ [MONGO] Successfully connected to MongoDB Atlas
✅ [MODELS] User model loaded
✅ [MODELS] Subscription model loaded
✅ [EMAIL] Transporter ready - emails can be sent
✅ [CRON] ✓ Reminder job scheduled for 9:00 AM daily
✅ Server running on http://localhost:5000
✅ Environment: development
✅ MongoDB: Connected and ready
```

### 2. Login with Demo User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "password"
  }'
```

**Copy the returned `token` value** - you'll need it for the next step.

### 3. Create Subscription Expiring Today (to test immediately)

```bash
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "serviceName": "Netflix",
    "description": "Test subscription for email reminders",
    "category": "entertainment",
    "amount": 499,
    "billingCycle": "monthly",
    "startDate": "2024-01-01",
    "endDate": "'$(date -d tomorrow +%Y-%m-%d)'",
    "reminderDaysBefore": 3,
    "paymentMethod": "credit card",
    "notes": "Testing email reminder system"
  }'
```

This creates a subscription expiring **tomorrow** (1 day remaining).

### 4. Manually Run Cron Job for Testing

Edit `/server/cron/reminderCron.js` line 36:

**Change from:**
```javascript
cron.schedule('0 9 * * *', async () => {
```

**To:**
```javascript
cron.schedule('*/1 * * * *', async () => {  // Every 1 minute
```

**Restart server:** `npm run dev`

**Wait 1 minute and check console for:**
```
[CRON] ========== Reminder Job Started ==========
[CRON] Processing 1 active subscriptions
[CRON] [Netflix] Days: 1 | Milestone: 1 | Email: reminder1Day | User: demo@example.com
[EMAIL] ✓ Sent reminder1Day to demo@example.com for Netflix
[CRON] Summary: 1 emails sent, 0 skipped
[CRON] ========== Job Completed (245ms) ==========
```

### 5. Check Email Was Sent

1. Go to your Gmail inbox (demo.billreminder@gmail.com)
2. Look for email with subject: **"🚨 Netflix Renewal - 1 Day Left!"**
3. Email should be sent to: **demo@example.com**

### 6. Verify Database Updated

Check subscription in MongoDB:

```bash
# Using MongoDB Compass or mongosh
db.subscriptions.findOne({ serviceName: "Netflix" })
```

**Should show:**
```json
{
  "serviceName": "Netflix",
  "lastNotified": 1,
  "lastReminderSent": ISODate("2024-01-25T10:30:00.000Z")
}
```

✅ **Success! Email reminder system is working!**

---

## Testing Different Reminder Scenarios

### Scenario 1: 7-Day Reminder

**Create subscription:**
```bash
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serviceName": "AWS",
    "amount": 5000,
    "category": "cloud",
    "startDate": "2024-01-01",
    "endDate": "'$(date -d "+7 days" +%Y-%m-%d)'",
    "billingCycle": "monthly"
  }'
```

**Expected email:** Subject line starts with "AWS Renewal - 7 Days Remaining"

**Email content:**
- Service: AWS
- Amount: ₹5000
- Expiry Date: (7 days from today)
- Gray styling (#333)
- Friendly reminder tone

---

### Scenario 2: 3-Day Reminder

**Create subscription:**
```bash
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serviceName": "Google Workspace",
    "amount": 1199,
    "category": "productivity",
    "startDate": "2024-01-01",
    "endDate": "'$(date -d "+3 days" +%Y-%m-%d)'",
    "billingCycle": "monthly"
  }'
```

**Expected email:** Subject starts with "⚠️ Google Workspace Renewal - 3 Days Left"

**Email content:**
- Service: Google Workspace
- Amount: ₹1199
- Orange/yellow warning styling
- Urgent reminder tone

---

### Scenario 3: Expiration Day (0 days)

**Create subscription:**
```bash
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serviceName": "Microsoft 365",
    "amount": 799,
    "category": "productivity",
    "startDate": "2024-01-01",
    "endDate": "'$(date +%Y-%m-%d)'",
    "billingCycle": "yearly"
  }'
```

**Expected email:** Subject: "❌ Microsoft 365 - Subscription Expired"

**Email content:**
- Service: Microsoft 365
- Amount: ₹799
- Dark red styling (#721c24)
- Critical action required tone

---

### Scenario 4: After Expiration (-1 days)

**Create subscription:**
```bash
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serviceName": "Figma",
    "amount": 499,
    "category": "design",
    "startDate": "2024-01-01",
    "endDate": "'$(date -d "yesterday" +%Y-%m-%d)'",
    "billingCycle": "monthly"
  }'
```

**Expected email:** Subject: "❌ Figma - Subscription Expired"

**Email content:**
- Dark red styling
- "Renewal required" tone
- Indicates subscription is overdue

---

## Duplicate Prevention Testing

### Test 1: Email Sent Only Once

1. Create subscription expiring in 3 days
2. Change cron to run every 1 minute
3. Wait for first cron run (email sent, lastNotified = 3)
4. Wait another minute (second cron run - no email, lastNotified still = 3)
5. Check console:
   ```
   [CRON] Summary: 1 emails sent, 0 skipped (first run)
   [CRON] Summary: 0 emails sent, 1 skipped (duplicate prevention)
   ```

### Test 2: Milestone Transitions

1. Create subscription expiring in 7 days
2. Wait for cron (email sent, lastNotified = 7)
3. Manually update endDate to 3 days from now:
   ```bash
   curl -X PUT http://localhost:5000/api/subscriptions/SUBSCRIPTION_ID \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"endDate": "'$(date -d "+3 days" +%Y-%m-%d)'"}'
   ```
4. Wait for cron (email sent, lastNotified = 3)
5. Check console shows transition from 7 → 3

---

## Email Content Verification

### Check Email Headers

Open the received email and view source/details:

**Expected headers:**
```
From: demo.billreminder@gmail.com
To: demo@example.com
Subject: [Depends on days remaining]
Content-Type: text/html; charset=utf-8
```

### Check Email Body

All emails should contain:

✓ Service name (e.g., "Netflix")
✓ Amount (e.g., "₹499")
✓ Expiry date
✓ Call-to-action text
✓ "Bill Remainder Team" signature
✓ Responsive HTML styling

---

## Database Verification

### Check Subscription Fields

```bash
# MongoDB Compass: Collections → subscriptions

{
  "_id": ObjectId("..."),
  "serviceName": "Netflix",
  "userId": ObjectId("..."),
  "email": "demo@example.com",
  "endDate": ISODate("2024-01-31T00:00:00.000Z"),
  "lastNotified": 7,
  "lastReminderSent": ISODate("2024-01-24T09:30:00.000Z"),
  "isActive": true
}
```

### Monitor Updates

After each cron run:

```javascript
// In MongoDB Compass, query:
db.subscriptions.find({ serviceName: "Netflix" })

// lastReminderSent should update
// lastNotified should match current milestone
```

---

## Debugging Checklist

### Cron Job Not Running?

- [ ] Check `[CRON]` messages in server logs
- [ ] Verify server is running: `npm run dev`
- [ ] Check system time matches expected cron time
- [ ] Restart server if cron schedule was modified
- [ ] Run: `node test-email-system.js`

### Emails Not Being Sent?

- [ ] Check `[EMAIL]` messages in server logs
- [ ] Verify `.env` has `EMAIL_USER` and `EMAIL_PASS`
- [ ] Test email connection: `node test-email-system.js`
- [ ] Check Gmail account: Is 2FA enabled? App password correct?
- [ ] Check inbox spam folder

### lastNotified Not Updating?

- [ ] Verify subscription exists in MongoDB
- [ ] Check `endDate` is set correctly
- [ ] Verify days remaining matches a milestone (7, 3, 2, 1, 0, -1)
- [ ] Check `isActive: true` in database
- [ ] Manually reset: `db.subscriptions.updateOne({}, {$set: {lastNotified: null}})`

### Email Content Issues?

- [ ] Check email is HTML formatted (not plain text)
- [ ] Verify service name displays correctly
- [ ] Check amount is a number in database
- [ ] Verify endDate is valid ISO format

---

## Performance Testing

### Load Test with Multiple Subscriptions

Create 10 subscriptions at different milestone levels:

```bash
# Create 10 subscriptions in a loop
for i in {1..10}; do
  DAYS=$((RANDOM % 10))
  curl -X POST http://localhost:5000/api/subscriptions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{
      "serviceName": "Service_'$i'",
      "amount": '$((RANDOM % 5000))',
      "startDate": "2024-01-01",
      "endDate": "'$(date -d "+"$DAYS" days" +%Y-%m-%d)'",
      "billingCycle": "monthly"
    }'
done
```

**Monitor performance:**
```
[CRON] Processing 10 active subscriptions
[CRON] Summary: 5 emails sent, 5 skipped
[CRON] ========== Job Completed (1245ms) ==========
```

Target: < 2 seconds for 100+ subscriptions

---

## Reset for Testing

### Clear lastNotified for All Subscriptions

```javascript
// MongoDB Compass → mongosh Console
db.subscriptions.updateMany({}, {$set: {lastNotified: null}})
```

Then cron will resend all emails at next run.

### Delete Test Subscriptions

```javascript
db.subscriptions.deleteMany({userId: "DEMO_USER_ID"})
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Test email with real Gmail account
- [ ] Verify cron runs at correct time (9:00 AM)
- [ ] Test with 100+ subscriptions
- [ ] Set up email logging/monitoring
- [ ] Configure error alerts (Sentry, LogRocket)
- [ ] Test on production MongoDB Atlas
- [ ] Update .env with production credentials
- [ ] Monitor first 7 days of emails
- [ ] Set up email delivery monitoring
- [ ] Document rollback procedure

---

## Common Issues & Solutions

### "Email credentials not configured"

**Error:** `[EMAIL] Skipped - EMAIL_USER or EMAIL_PASS not configured`

**Solution:**
1. Check `.env` file exists in `/server/` directory
2. Verify `EMAIL_USER=xxx@gmail.com` is set
3. Verify `EMAIL_PASS=xxxx xxxx xxxx xxxx` is set (16 chars with spaces)
4. Restart server: `npm run dev`

### "User not found for subscription"

**Error:** `[CRON] User not found for subscription 507f1f77bcf86cd799439011`

**Solution:**
1. Verify subscription's `userId` exists in Users collection
2. Check subscription wasn't created by deleted user
3. Verify MongoDB references are valid

### "Transporter verification failed"

**Error:** `[EMAIL] Transporter verification failed: Invalid login...`

**Solution:**
1. Go to: https://myaccount.google.com/apppasswords
2. Generate new app password
3. Update `EMAIL_PASS` in `.env`
4. Restart server

### "No active subscriptions found"

**Warning:** `[CRON] No active subscriptions found`

**Solution:**
1. Create test subscription via API
2. Verify `isActive: true` in database
3. Check database connection is working

---

## Next Steps

1. Complete end-to-end test above
2. Create 3-5 test subscriptions
3. Monitor cron job for 1 full day cycle
4. Verify all email milestones send correctly
5. Check duplicate prevention works
6. Deploy to production

**Questions?** Check console logs with `[CRON]` and `[EMAIL]` prefixes.
