# API Documentation - Email Reminder System

## Subscription Endpoints

### Create Subscription

**Endpoint:** `POST /api/subscriptions`

**Authentication:** Required (Bearer token in Authorization header)

**Request Body:**
```json
{
  "serviceName": "Netflix",
  "description": "Monthly streaming service",
  "category": "entertainment",
  "amount": 499,
  "billingCycle": "monthly",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "reminderDaysBefore": 3,
  "paymentMethod": "credit card",
  "notes": "Subscription renewal in January"
}
```

**Required Fields:**
- `serviceName` (String) - Name of subscription service
- `amount` (Number) - Subscription cost
- `startDate` (Date) - When subscription started (ISO format: YYYY-MM-DD)
- `endDate` (Date) - When subscription expires (ISO format: YYYY-MM-DD) **[NEW]**

**Optional Fields:**
- `description` (String) - Additional details
- `category` (String) - Type of subscription (default: "other")
- `billingCycle` (String) - "monthly" | "yearly" | "custom" (default: "monthly")
- `billingCycleDays` (Number) - Days for custom billing cycle
- `reminderDaysBefore` (Number) - Days before expiry to send reminder (default: 3)
- `paymentMethod` (String) - How payment is made
- `notes` (String) - User notes

**Response:** (Success)
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "subscription": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439010",
    "serviceName": "Netflix",
    "description": "Monthly streaming service",
    "category": "entertainment",
    "amount": 499,
    "billingCycle": "monthly",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T00:00:00.000Z",
    "nextDueDate": "2024-01-01T00:00:00.000Z",
    "email": "user@example.com",
    "reminderDaysBefore": 3,
    "paymentMethod": "credit card",
    "notes": "Subscription renewal in January",
    "isActive": true,
    "lastNotified": null,
    "lastReminderSent": null,
    "createdAt": "2024-01-01T10:30:00.000Z",
    "updatedAt": "2024-01-01T10:30:00.000Z"
  }
}
```

**Response:** (Error - Missing endDate)
```json
{
  "success": false,
  "message": "Service name, amount, start date, and end date are required"
}
```

---

### Update Subscription

**Endpoint:** `PUT /api/subscriptions/:id`

**Authentication:** Required (Bearer token in Authorization header)

**Request Body:**
```json
{
  "serviceName": "Netflix Premium",
  "amount": 549,
  "endDate": "2024-02-28",
  "isActive": true
}
```

**Updatable Fields:**
- `serviceName`
- `description`
- `category`
- `amount`
- `billingCycle`
- `billingCycleDays`
- `startDate`
- `endDate` - Can be updated to recalculate reminder schedule
- `nextDueDate`
- `reminderDaysBefore`
- `paymentMethod`
- `notes`
- `isActive`

**Response:** (Success)
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "subscription": {
    "_id": "507f1f77bcf86cd799439011",
    "serviceName": "Netflix Premium",
    "amount": 549,
    "endDate": "2024-02-28T00:00:00.000Z",
    "lastNotified": null,
    "isActive": true
  }
}
```

---

### Get All Subscriptions

**Endpoint:** `GET /api/subscriptions`

**Authentication:** Required

**Query Parameters:**
- `isActive` (Boolean, optional) - Filter by active status

**Response:**
```json
{
  "success": true,
  "subscriptions": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "serviceName": "Netflix",
      "amount": 499,
      "category": "entertainment",
      "endDate": "2024-01-31T00:00:00.000Z",
      "lastNotified": 7,
      "isActive": true
    }
  ],
  "count": 1
}
```

---

### Get Subscription by ID

**Endpoint:** `GET /api/subscriptions/:id`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "subscription": {
    "_id": "507f1f77bcf86cd799439011",
    "serviceName": "Netflix",
    "amount": 499,
    "endDate": "2024-01-31T00:00:00.000Z",
    "lastNotified": 7,
    "lastReminderSent": "2024-01-24T09:00:00.000Z",
    "isActive": true
  }
}
```

---

## Email Reminder Field Descriptions

### endDate (New Required Field)

**Type:** Date (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)

**Purpose:** Defines when subscription expires. The cron job calculates days remaining from this date.

**Example:**
- Subscription starts: 2024-01-01
- Subscription ends: 2024-01-31
- Days remaining: 30

**Reminders will be sent when:**
- 7 days remaining
- 3 days remaining
- 2 days remaining
- 1 day remaining
- 0 days remaining (expiry day)
- -1 days (day after expiry)

---

### lastNotified (New Field)

**Type:** Number | Null

**Values:** 7, 3, 2, 1, 0, -1, or null

**Purpose:** Tracks which reminder milestone was sent to prevent duplicate emails.

**Example Timeline:**
```
endDate: 2024-01-31

2024-01-24, 9:00 AM: 7 days remaining
  → lastNotified = 7
  → Email sent: "7 Days Remaining"

2024-01-25, 9:00 AM: 6 days remaining
  → lastNotified = 7 (unchanged)
  → No email sent (no milestone)

2024-01-28, 9:00 AM: 3 days remaining
  → lastNotified = 3
  → Email sent: "3 Days Left"

2024-01-30, 9:00 AM: 1 day remaining
  → lastNotified = 1
  → Email sent: "1 Day Left!"

2024-01-31, 9:00 AM: 0 days remaining
  → lastNotified = 0
  → Email sent: "Subscription Expired"

2024-02-01, 9:00 AM: -1 days remaining
  → lastNotified = -1
  → Email sent: "Renewal Required"
```

---

### email (New Field)

**Type:** String

**Purpose:** User's email address for sending reminders.

**Auto-populated:** Automatically filled from authenticated user's email on creation.

**Example:** "user@example.com"

---

## Example: Create Subscription with Email Reminders

### Step 1: Authenticate
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "password"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439010",
    "email": "demo@example.com"
  }
}
```

### Step 2: Create Subscription with endDate

```bash
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "serviceName": "Netflix",
    "description": "Monthly streaming service",
    "category": "entertainment",
    "amount": 499,
    "billingCycle": "monthly",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "reminderDaysBefore": 3,
    "paymentMethod": "credit card",
    "notes": "Premium plan with 4K"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "subscription": {
    "_id": "507f1f77bcf86cd799439011",
    "serviceName": "Netflix",
    "amount": 499,
    "email": "demo@example.com",
    "endDate": "2024-01-31T00:00:00.000Z",
    "lastNotified": null,
    "isActive": true
  }
}
```

### Step 3: Monitor Email Reminders

**Console logs show:**
```
[CRON] ========== Reminder Job Started ==========
[CRON] Processing 1 active subscriptions
[CRON] [Netflix] Days: 7 | Milestone: 7 | Email: reminder7Days | User: demo@example.com
[EMAIL] ✓ Sent reminder7Days to demo@example.com for Netflix (MessageID: <abc123@gmail.com>)
[CRON] Summary: 1 emails sent, 0 skipped (duplicate prevention)
[CRON] ========== Job Completed (125ms) ==========
```

---

## Error Codes

| Code | Status | Message | Cause |
|------|--------|---------|-------|
| 400 | Bad Request | Service name, amount, start date, and end date are required | Missing required fields |
| 401 | Unauthorized | No token provided | Missing Authorization header |
| 403 | Forbidden | Invalid or expired token | Invalid JWT token |
| 404 | Not Found | Subscription not found | ID doesn't exist or belongs to different user |
| 500 | Server Error | Internal server error | Database or server issue |

---

## Testing with Postman

### Import Collection

1. Open Postman
2. Import `Bill_Reminder_API.postman_collection.json`
3. Set variable: `baseURL = http://localhost:5000`
4. Set variable: `token = [JWT token from login]`

### Create Subscription Request

**Method:** POST
**URL:** `{{baseURL}}/api/subscriptions`
**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (raw JSON):**
```json
{
  "serviceName": "Netflix",
  "description": "Monthly streaming",
  "category": "entertainment",
  "amount": 499,
  "billingCycle": "monthly",
  "startDate": "2024-01-15",
  "endDate": "2024-02-15",
  "reminderDaysBefore": 3,
  "paymentMethod": "credit card"
}
```

---

## Troubleshooting

### Email not received?

1. Check `.env` has `EMAIL_USER` and `EMAIL_PASS`
2. Verify subscription has `endDate` set
3. Check server logs for `[CRON]` and `[EMAIL]` messages
4. Run test: `node test-email-system.js`

### lastNotified shows null?

- Email hasn't been sent yet
- Days until expiry doesn't match any milestone (7, 3, 2, 1, 0, -1)
- Cron job hasn't run yet (runs at 9:00 AM daily)

### Getting "endDate required" error?

- Ensure request includes `endDate` field
- Format must be valid date: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`
- Example: `"2024-01-31"` ✓ or `"2024-01-31T00:00:00Z"` ✓

### MongoDB connection hanging?

- Check IP whitelist at https://cloud.mongodb.com/v2
- Verify credentials in `MONGODB_URI`
- Test with: `node test-email-system.js`

---

## Next Steps

1. Create subscriptions with `endDate` field
2. Monitor server logs for `[CRON]` messages
3. Verify emails arrive in inbox
4. Check `lastNotified` field updates correctly
5. For production: Configure proper logging and monitoring
