# Complete Guide: Add Subscription & Receive Email Reminders

## Current Status

✅ **Server:** Running on http://localhost:5000
✅ **Database:** Connected to MongoDB Atlas
✅ **Cron Job:** Scheduled for 9:00 AM daily
⚠️ **Email:** Credentials need to be verified

---

## Step 1: Use Postman to Create Subscription

### Option A: Use Postman Collection

1. Open Postman
2. Import: `Bill_Reminder_API.postman_collection.json`
3. Select `Auth → Login` endpoint
4. Click **Send**
5. Copy the `token` from response

### Option B: Create Request Manually

**Method:** POST
**URL:** `http://localhost:5000/api/auth/login`
**Body (raw JSON):**
```json
{
  "email": "demo@example.com",
  "password": "password"
}
```

---

## Step 2: Create Subscription with endDate

**Method:** POST
**URL:** `http://localhost:5000/api/subscriptions`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {COPY_TOKEN_HERE}
```

**Body (raw JSON):**
```json
{
  "serviceName": "Netflix",
  "description": "Test subscription",
  "category": "entertainment",
  "amount": 499,
  "billingCycle": "monthly",
  "startDate": "2024-01-01",
  "endDate": "2024-02-01",
  "reminderDaysBefore": 1,
  "paymentMethod": "credit card",
  "notes": "Testing email reminder system"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "subscription": {
    "_id": "60d6c8e8f8e8f8e8f8e8f8e8",
    "serviceName": "Netflix",
    "amount": 499,
    "email": "demo@example.com",
    "endDate": "2024-02-01T00:00:00.000Z",
    "lastNotified": null,
    "isActive": true
  }
}
```

---

## Step 3: Test Email Sending

### Option A: Wait for 9 AM (Automatic)
- Emails send automatically at **9:00 AM daily**
- Check your inbox for reminder email

### Option B: Test Immediately (Manual)

**Edit `/server/cron/reminderCron.js` line 58:**

Change from:
```javascript
const job = cron.schedule('0 9 * * *', async () => {
```

To (run every 1 minute):
```javascript
const job = cron.schedule('*/1 * * * *', async () => {
```

Or (run every 10 minutes):
```javascript
const job = cron.schedule('*/10 * * * *', async () => {
```

**Restart server:**
```bash
npm run dev
```

**Wait and check:**
1. Server console for: `[CRON] Processing 1 active subscriptions`
2. Inbox for email from: `demo.billreminder@gmail.com`
3. Database: `lastNotified` should change from `null` to `1`

---

## Step 4: Fix Email Credentials (If Needed)

If emails aren't sending, the Gmail credentials need to be valid:

### Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select: **Mail** and **Windows Computer**
3. Google generates a **16-character password**
4. Copy it (format: `xxxx xxxx xxxx xxxx`)

### Update .env

Edit `/server/.env`:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

### Restart Server

```bash
npm run dev
```

---

## What Happens When Subscription is Created

| Time | Action | Result |
|------|--------|--------|
| Creation | Subscription saved in MongoDB | `lastNotified: null` |
| 9 AM | Cron checks subscription | Calculates days until expiry |
| 9 AM | Days = 1 | Sends "1 Day Left!" email |
| 9 AM | Updates database | Sets `lastNotified: 1` |
| Next day | Cron runs again | Skips (already sent milestone 1) |

---

## Email Reminder Timeline

For subscription expiring on **Jan 31**:

| Date | Days Left | Email Sent | Subject |
|------|-----------|-----------|---------|
| Jan 24 | 7 | Yes | Netflix Renewal - 7 Days Remaining |
| Jan 25-27 | 6-4 | No | (No milestone) |
| Jan 28 | 3 | Yes | ⚠️ Netflix Renewal - 3 Days Left |
| Jan 29 | 2 | Yes | 🚨 Netflix Renewal - 1 Day Left! |
| Jan 30 | 1 | Yes | 🚨 Netflix Renewal - 1 Day Left! |
| Jan 31 | 0 | Yes | ❌ Netflix - Subscription Expired |
| Feb 1 | -1 | Yes | ❌ Netflix - Subscription Expired |

---

## Troubleshooting

### "Service name, amount, start date, and end date are required"

**Problem:** Missing required field

**Solution:** Ensure request body includes:
- ✓ `serviceName`
- ✓ `amount`
- ✓ `startDate`
- ✓ `endDate` ← **This is required!**

---

### Emails not received

**Problem 1:** Gmail credentials invalid
```
[EMAIL] ⚠️  Transporter verification failed: Invalid login
```
**Fix:** 
1. Generate new app password at: https://myaccount.google.com/apppasswords
2. Update `.env` with correct `EMAIL_PASS`
3. Restart server

**Problem 2:** Cron hasn't run yet
```
[CRON] Processing 1 active subscriptions
```
**Fix:**
1. Wait until 9 AM, OR
2. Change cron schedule to every 1 minute for testing

**Problem 3:** Email address not set
```
[CRON] User not found for subscription
```
**Fix:**
1. Verify user exists in database
2. Check user has valid email address

---

### "Authorization failed" or "Invalid token"

**Problem:** Token expired or missing

**Solution:**
1. Login again to get new token
2. Copy entire token (including `Bearer `)
3. Paste in Authorization header

---

### Subscription created but lastNotified still null

**Reason:** Cron job hasn't run yet (runs at 9 AM daily)

**Solution:** 
1. Change cron schedule to test immediately (see Step 3 Option B)
2. Or wait until 9:00 AM

---

## Database Fields Explained

### Subscription Document

```javascript
{
  _id: ObjectId,                  // Unique ID
  userId: ObjectId,               // Reference to User
  serviceName: "Netflix",         // Service name
  email: "user@example.com",      // Email for reminders (NEW)
  endDate: "2024-02-01",          // Expiry date (NEW)
  lastNotified: 1,                // Last milestone sent (NEW)
  lastReminderSent: "2024-01-30T09:00:00Z",  // When email was sent
  isActive: true,                 // Is active
  amount: 499,
  category: "entertainment"
}
```

---

## Email Content Example

**From:** demo.billreminder@gmail.com
**To:** demo@example.com
**Subject:** Netflix Renewal - 7 Days Remaining

**Content:**
```
Your subscription for Netflix will expire in 7 days.

Service: Netflix
Amount: ₹499
Expiry Date: 2/1/2024

Please update your payment method or renew your subscription 
to avoid service interruption.

Best regards,
Bill Remainder Team
```

---

## Complete Flow Diagram

```
1. LOGIN
   POST /api/auth/login
   ↓
   Returns: {token, user}

2. CREATE SUBSCRIPTION
   POST /api/subscriptions
   Headers: Authorization: Bearer {token}
   Body: {serviceName, amount, startDate, endDate}
   ↓
   Returns: {subscription with email, endDate, lastNotified: null}

3. STORED IN MONGODB
   ↓
   subscription document with:
   - email (from authenticated user)
   - endDate (from request)
   - lastNotified: null (initially)
   - isActive: true

4. DAILY CRON (9 AM)
   ↓
   Calculate: daysLeft = (endDate - today)
   ↓
   If daysLeft = 1 AND lastNotified ≠ 1:
     → Send email
     → Update lastNotified = 1
     → Update lastReminderSent = now()
   ↓
   Next day: Skip (lastNotified already = 1)

5. EMAIL RECEIVED
   ↓
   Subject: Netflix Renewal - 1 Day Left!
   Body: Service details + action needed
```

---

## Quick Checklist

- [ ] Server running: `npm run dev`
- [ ] Login and get token
- [ ] POST subscription with all required fields
- [ ] Subscription response shows: `email`, `endDate`, `lastNotified: null`
- [ ] For immediate test: Change cron schedule
- [ ] Wait 1-10 minutes for cron job
- [ ] Check inbox for email
- [ ] Verify MongoDB: `lastNotified` changed to `1` (or appropriate milestone)

---

## Success Indicators

✅ **Subscription Created:**
- Response status: 201
- Response includes: `email`, `endDate`, `lastNotified`

✅ **Cron Running:**
- Console shows: `[CRON] Processing X active subscriptions`
- Console shows: `[EMAIL] ✓ Sent reminder1Day`

✅ **Email Sent:**
- Email arrives in inbox
- Subject contains service name and reminder level
- From address: `demo.billreminder@gmail.com`

✅ **Database Updated:**
- `lastNotified` changes from `null` to milestone number
- `lastReminderSent` updates to current timestamp

---

## Support

**Documentation Files:**
- `/README_EMAIL_REMINDERS.md` - Complete system overview
- `/QUICK_REFERENCE.md` - Quick setup reference
- `/API_DOCUMENTATION.md` - API endpoint details
- `/TESTING_GUIDE.md` - Detailed testing procedures

**Test Configuration:**
```bash
node test-subscription.js
```

**Check Status:**
- Look for `[CRON]` messages in console
- Check `[EMAIL]` status logs
- Monitor `[MONGO]` connection status
