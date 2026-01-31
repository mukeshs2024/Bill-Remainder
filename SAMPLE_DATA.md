/**
 * Sample Data for Testing
 * Use these examples to test the API endpoints
 */

// ============================================
// SAMPLE USERS
// ============================================

const sampleUsers = [
  {
    username: "john_doe",
    email: "john@example.com",
    password: "JohnPassword123",
    firstName: "John",
    lastName: "Doe"
  },
  {
    username: "jane_smith",
    email: "jane@example.com",
    password: "JanePassword123",
    firstName: "Jane",
    lastName: "Smith"
  }
];

// ============================================
// SAMPLE SUBSCRIPTIONS
// ============================================

const sampleSubscriptions = [
  {
    serviceName: "Netflix",
    description: "Video streaming service - Premium plan",
    category: "OTT",
    amount: 499,
    currency: "INR",
    billingCycle: "monthly",
    startDate: "2024-01-15",
    reminderDaysBefore: 3,
    paymentMethod: "credit_card",
    notes: "Premium plan with 4 screens and HD quality"
  },
  {
    serviceName: "Electricity Bill",
    description: "Monthly electricity charges",
    category: "Utility",
    amount: 1500,
    currency: "INR",
    billingCycle: "monthly",
    startDate: "2024-01-05",
    reminderDaysBefore: 5,
    paymentMethod: "net_banking",
    notes: "Consumer #12345678"
  },
  {
    serviceName: "Internet Connection",
    description: "Broadband internet service",
    category: "Internet",
    amount: 799,
    currency: "INR",
    billingCycle: "monthly",
    startDate: "2024-01-10",
    reminderDaysBefore: 3,
    paymentMethod: "credit_card",
    notes: "500 Mbps connection"
  },
  {
    serviceName: "Prime Video",
    description: "Amazon Prime Video subscription",
    category: "OTT",
    amount: 199,
    currency: "INR",
    billingCycle: "monthly",
    startDate: "2024-01-20",
    reminderDaysBefore: 2,
    paymentMethod: "upi",
    notes: "Includes Prime benefits"
  },
  {
    serviceName: "Spotify",
    description: "Music streaming service",
    category: "Subscription",
    amount: 119,
    currency: "INR",
    billingCycle: "monthly",
    startDate: "2024-01-25",
    reminderDaysBefore: 3,
    paymentMethod: "credit_card",
    notes: "Premium individual plan"
  },
  {
    serviceName: "Water Bill",
    description: "Monthly water charges",
    category: "Utility",
    amount: 300,
    currency: "INR",
    billingCycle: "monthly",
    startDate: "2024-01-15",
    reminderDaysBefore: 4,
    paymentMethod: "net_banking",
    notes: "Metered water supply"
  },
  {
    serviceName: "Health Insurance",
    description: "Annual health insurance premium",
    category: "Insurance",
    amount: 25000,
    currency: "INR",
    billingCycle: "yearly",
    startDate: "2024-01-01",
    reminderDaysBefore: 10,
    paymentMethod: "credit_card",
    notes: "Family health insurance plan"
  },
  {
    serviceName: "Adobe Creative Cloud",
    description: "Design software subscription",
    category: "Subscription",
    amount: 599,
    currency: "INR",
    billingCycle: "monthly",
    startDate: "2024-01-05",
    reminderDaysBefore: 2,
    paymentMethod: "credit_card",
    notes: "All apps plan"
  }
];

// ============================================
// API TESTING WITH CURL
// ============================================

/*
1. REGISTER A NEW USER
   
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User"
  }'

2. LOGIN USER

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'

3. GET CURRENT USER (replace TOKEN with actual token)

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

4. CREATE SUBSCRIPTION

curl -X POST http://localhost:5000/api/subscriptions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "Netflix",
    "category": "OTT",
    "amount": 499,
    "billingCycle": "monthly",
    "startDate": "2024-01-15",
    "reminderDaysBefore": 3,
    "paymentMethod": "credit_card",
    "description": "Video streaming service"
  }'

5. GET ALL SUBSCRIPTIONS

curl -X GET http://localhost:5000/api/subscriptions \
  -H "Authorization: Bearer TOKEN"

6. GET UPCOMING SUBSCRIPTIONS

curl -X GET "http://localhost:5000/api/subscriptions/upcoming?days=7" \
  -H "Authorization: Bearer TOKEN"

7. GET DASHBOARD STATS

curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer TOKEN"

8. MARK SUBSCRIPTION AS PAID

curl -X PUT http://localhost:5000/api/subscriptions/{id}/mark-paid \
  -H "Authorization: Bearer TOKEN"

9. UPDATE SUBSCRIPTION

curl -X PUT http://localhost:5000/api/subscriptions/{id} \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 599,
    "reminderDaysBefore": 5
  }'

10. DELETE SUBSCRIPTION

curl -X DELETE http://localhost:5000/api/subscriptions/{id} \
  -H "Authorization: Bearer TOKEN"

11. HEALTH CHECK

curl http://localhost:5000/api/health
*/

// ============================================
// POSTMAN IMPORT EXAMPLE
// ============================================

const postmanCollection = {
  info: {
    name: "Bill Reminder API",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: [
    {
      name: "Auth",
      item: [
        {
          name: "Register",
          request: {
            method: "POST",
            url: "http://localhost:5000/api/auth/register"
          }
        },
        {
          name: "Login",
          request: {
            method: "POST",
            url: "http://localhost:5000/api/auth/login"
          }
        }
      ]
    },
    {
      name: "Subscriptions",
      item: [
        {
          name: "Get All",
          request: {
            method: "GET",
            url: "http://localhost:5000/api/subscriptions"
          }
        },
        {
          name: "Create",
          request: {
            method: "POST",
            url: "http://localhost:5000/api/subscriptions"
          }
        }
      ]
    }
  ]
};

module.exports = {
  sampleUsers,
  sampleSubscriptions,
  postmanCollection
};
