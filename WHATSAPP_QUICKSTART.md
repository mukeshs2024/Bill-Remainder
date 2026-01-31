# WhatsApp Reminder Setup - Quick Start

## STEP 1: Install Twilio Package
```bash
cd server
npm install twilio
```

## STEP 2: Get Twilio Credentials

Visit https://console.twilio.com:
1. **Account SID**: Copy from main dashboard (ACxxxxx)
2. **Auth Token**: Copy from main dashboard (under Account SID)
3. **WhatsApp Number**: Activate sandbox or create approved number
   - Sandbox: +14155552671 (test mode)
   - Production: Your approved WhatsApp number

## STEP 3: Update .env

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=+14155552671
```

## STEP 4: Add Phone to Subscriptions

Each subscription needs a phone field in E.164 format:
```javascript
phone: "+919876543210"  // India
phone: "+12015550123"   // USA
phone: "+442071838750"  // UK
```

### Option A: Use Frontend
Edit subscription → Add phone field

### Option B: MongoDB Update
```javascript
db.subscriptions.updateMany(
  { phone: { $exists: false } },
  { $set: { phone: "+919876543210" } }
)
```

## STEP 5: Ensure Expiry Dates
```javascript
db.subscriptions.find({ endDate: { $exists: false } })
```
Add `endDate` to all subscriptions if missing.

## STEP 6: Restart Server
```bash
npm start
```

Expected output:
```
[CRON] Initializing hourly WhatsApp reminder job...
[WHATSAPP] ✅ Twilio credentials verified
[CRON] ✅ Hourly WhatsApp job scheduled
```

## STEP 7: Test WhatsApp Messages

The cron job runs **every hour at minute 0** (00:00, 01:00, 02:00, etc.)

Messages send when subscription is at:
- **7 days** before expiry: "expires in 7 days"
- **3 days** before expiry: "expires in 3 days"
- **2 days** before expiry: "expires in 2 days"
- **1 day** before expiry: "expires in 1 day!"
- **0 days** (expiry today): "expires TODAY!"
- **-1 day** (expired): "subscription expired"

Each milestone sends ONCE (tracked in `remindersSent` array).

## Message Examples

```
⏰ Netflix expires in 3 days.
📅 Expiry: 2026-02-01
```

```
⏰ Netflix expires TODAY!
📅 Expiry: 2026-02-01
```

```
❌ Netflix subscription expired.
📅 Expiry Date: 2026-02-01
```

## Troubleshooting

**No messages sent?**
- Check phone field is set (E.164 format: +91...)
- Check endDate field is set
- Check subscription isActive = true
- Check cron logs in server console
- Verify Twilio credentials in .env

**"Invalid phone number" error?**
- Must start with +
- Include country code
- No spaces or dashes
- Examples: +919876543210, +12015550123

**Twilio error "Invalid From"?**
- Check TWILIO_WHATSAPP_FROM number is correct
- Must be approved WhatsApp number
- Can use +14155552671 for testing

## Server Logs

Each hour you'll see:
```
[CRON] Starting hourly WhatsApp job at 2026-01-30 14:00:00 UTC
[WHATSAPP] SENT | subscriptionId | to +91... | day_X | messageId: SMxxxxx
[WHATSAPP] RECORDED | subscriptionId | day_X
[SKIP] subscriptionId | No phone
[CRON] Hourly Job | Processed: X | Sent: Y | Skipped: Z | Errors: 0 | Xms
```

## Key Differences from Email System

| Feature | Email | WhatsApp |
|---------|-------|----------|
| Execution | Daily (9:46 PM IST) | Hourly (00, 01, 02...) |
| Delivery | Email inbox | WhatsApp chat |
| Reliability | Medium | High |
| Field | subscription.email | subscription.phone |
| Service | Nodemailer + Gmail | Twilio WhatsApp API |

## No Code Changes Needed

- All API endpoints unchanged
- User authentication unchanged
- Subscription schema backward compatible
- Can keep email code as fallback

