# Twilio WhatsApp Setup Guide

## ✅ STATUS: Server Running

Your server is now running with WhatsApp support configured!

```
✅ Server running on http://localhost:5000
✅ Environment: development
✅ MongoDB: Connected and ready
[CRON] ✅ Hourly WhatsApp job scheduled
```

## 🔧 Configuring Twilio Credentials

### Step 1: Create Twilio Account
1. Visit https://www.twilio.com/console
2. Sign up or log in
3. Copy your **Account SID** (starts with AC)
4. Copy your **Auth Token** (shown in dashboard)

### Step 2: Get WhatsApp Number
Option A - **For Testing (Sandbox)**:
- Use Twilio's sandbox number: `+14155552671`
- No phone verification needed
- Limited testing capability

Option B - **For Production**:
- Purchase a dedicated WhatsApp number
- Go to https://console.twilio.com → Messaging → WhatsApp
- Request number approval

### Step 3: Update .env
Edit `server/.env` and add your credentials:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=+14155552671
```

Replace:
- `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` → Your Account SID
- `your_auth_token_here` → Your Auth Token
- `+14155552671` → Your WhatsApp number (or sandbox)

### Step 4: Restart Server
```bash
npm start
```

Expected output:
```
[WHATSAPP] ✅ Twilio credentials verified
[CRON] ✅ Hourly WhatsApp job scheduled
```

## 📱 Add Phone Numbers to Subscriptions

Update each subscription with a WhatsApp phone number in **E.164 format**:

**Format: +[country code][number]**

Examples:
- India: `+919876543210`
- USA: `+12015550123`
- UK: `+442071838750`
- Canada: `+14165550123`

### Via UI:
1. Open Bill Reminder app
2. Edit subscription
3. Add phone field: `+919876543210`
4. Save

### Via MongoDB:
```javascript
db.subscriptions.updateMany(
  { _id: ObjectId("...") },
  { $set: { phone: "+919876543210" } }
)
```

## 📋 Phone Number Format Rules

✅ **VALID:**
- `+919876543210` (starts with +, includes country code)
- `+12015550123`
- `+442071838750`

❌ **INVALID:**
- `919876543210` (missing +)
- `+91 98765 43210` (spaces not allowed)
- `+91-9876543210` (dashes not allowed)
- `9876543210` (missing country code)

## 🕐 How Hourly Reminders Work

Cron job runs every hour at minute 0:
- 00:00, 01:00, 02:00, ... 23:00

Sends WhatsApp at these milestones:
- **7 days** before expiry
- **3 days** before expiry
- **2 days** before expiry
- **1 day** before expiry
- **0 days** (expiry day)
- **-1 day** (after expiry)

Each milestone sends **ONCE** (tracked in `remindersSent` array).

## 📨 Message Examples

### Upcoming Expiry (3 days)
```
⏰ Netflix expires in 3 days.
📅 Expiry: 2026-02-01
```

### Today
```
⏰ Netflix expires TODAY!
📅 Expiry: 2026-02-01
```

### Expired
```
❌ Netflix subscription expired.
📅 Expiry Date: 2026-02-01
```

## 🔍 Server Logs

Check hourly runs in terminal:

```
[CRON] Starting hourly WhatsApp job at 2026-01-30 14:00:00 UTC
[WHATSAPP] SENT | 697cb1fec63dee735378dcf8 | to +91... | day_7 | messageId: SMxxxxx
[WHATSAPP] RECORDED | 697cb1fec63dee735378dcf8 | day_7
[SKIP] 697cd01a1845acd94a3fe97b | No phone
[CRON] Hourly Job | Processed: 3 | Sent: 1 | Skipped: 2 | Errors: 0 | 245ms
```

## ❌ Troubleshooting

### "Twilio credentials not configured"
- Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` to .env
- Restart server
- Verify in server logs

### "Invalid phone number"
- Must include `+` prefix
- Must include country code
- No spaces or special characters
- Example: `+919876543210`

### "Messages not being sent"
- Check subscription has `phone` field set
- Check subscription has `endDate` set
- Check subscription `isActive: true`
- Wait for cron to run (next hour at :00)
- Check server logs for [SKIP] entries

### Twilio API Errors
- Verify Account SID and Auth Token are correct
- Check WhatsApp number is approved/active
- Ensure sufficient Twilio account balance
- Check Twilio console for API logs

## 🧪 Test Mode

To test WhatsApp without production Twilio:

### Option 1: Use Twilio Sandbox
```env
TWILIO_WHATSAPP_FROM=+14155552671
```

Then send a test message FROM Twilio's sandbox number to verify setup.

### Option 2: Mock Testing
Edit `server/utils/whatsapp.js` to log messages instead of sending:

```javascript
// const response = await client.messages.create({...});
console.log('[WHATSAPP] TEST MODE | Message would be sent to:', to);
console.log('[WHATSAPP] TEST MODE | Message:', message);
```

## 📊 Production Checklist

- [ ] Twilio account created
- [ ] Account SID copied to .env
- [ ] Auth Token copied to .env
- [ ] WhatsApp number configured
- [ ] TWILIO_WHATSAPP_FROM set to your number
- [ ] Server restarted
- [ ] Subscriptions have phone numbers added
- [ ] Phone numbers in E.164 format
- [ ] Subscriptions have endDate set
- [ ] Subscriptions are isActive: true
- [ ] Cron logs show "✅ Hourly WhatsApp job scheduled"

## 💡 Next Steps

1. Get Twilio credentials from https://console.twilio.com
2. Update `.env` with Account SID, Auth Token, WhatsApp number
3. Restart server
4. Add phone numbers to subscriptions
5. Wait for next hourly run (at minute 0)
6. Check server logs for successful sends

