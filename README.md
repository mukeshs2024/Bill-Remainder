# 📊 Smart Subscription & Bill Reminder System

A comprehensive full-stack web application to track subscriptions and bills, receive timely reminders, and monitor monthly expenses with detailed analytics.

## 🎯 Features

### Core Functionality
- ✅ **User Authentication** - Secure registration and login with JWT tokens
- ✅ **Subscription Management** - Add, edit, delete, and track subscriptions
- ✅ **Smart Reminders** - Automated email notifications before due dates
- ✅ **Dashboard Analytics** - Visual overview of spending and upcoming bills
- ✅ **Category Tracking** - Organize subscriptions by category (OTT, Utilities, etc.)
- ✅ **Payment Status** - Mark bills as paid and auto-calculate next due dates
- ✅ **Monthly Reports** - Track spending patterns over time

### Billing Cycles Supported
- Monthly subscriptions
- Yearly subscriptions
- Custom billing cycles (any number of days)

### Notification Features
- Email reminders before due dates
- Configurable reminder days (1-30 days before)
- User preference settings for notifications

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs (hashing)
- **Email Service**: Nodemailer
- **Scheduling**: node-cron (for automated reminders)
- **Validation**: express-validator

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: Lucide React

## 📁 Project Structure

```
Bill Remainder/
├── server/                          # Backend Application
│   ├── models/                      # MongoDB Schemas
│   │   ├── User.js                 # User schema with auth
│   │   └── Subscription.js         # Subscription schema
│   ├── controllers/                 # Business Logic
│   │   ├── authController.js       # Auth logic
│   │   ├── subscriptionController.js
│   │   └── dashboardController.js
│   ├── routes/                      # API Routes
│   │   ├── authRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   └── dashboardRoutes.js
│   ├── middleware/                  # Express Middleware
│   │   ├── authenticate.js         # JWT verification
│   │   └── errorHandler.js         # Global error handling
│   ├── utils/                       # Utility Functions
│   │   ├── emailService.js         # Nodemailer setup
│   │   └── jwtUtils.js             # Token generation
│   ├── cron/                        # Scheduled Jobs
│   │   └── reminderService.js      # Daily reminder cron
│   ├── server.js                    # Main server file
│   ├── package.json
│   ├── .env.example
│   └── .env                         # (create from .env.example)
│
└── client/                          # Frontend Application
    ├── src/
    │   ├── pages/                   # React Pages
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── SubscriptionsList.jsx
    │   │   └── AddEditSubscription.jsx
    │   ├── components/              # React Components
    │   │   └── Navigation.jsx
    │   ├── services/                # API Integration
    │   │   └── api.js               # Axios instance
    │   ├── App.jsx                  # Main App component
    │   ├── index.jsx                # Entry point
    │   └── index.css                # Tailwind styles
    ├── public/
    │   └── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── .env.example
    └── .env                         # (create from .env.example)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud like MongoDB Atlas)
- npm or yarn package manager

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure .env file**
   ```env
   PORT=5000
   NODE_ENV=development
   
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/bill-reminder
   # For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/bill-reminder
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRY=7d
   
   # Email (Gmail example)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password  # Use App Password, not regular password
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the server**
   ```bash
   npm run dev    # Development with auto-reload
   npm start      # Production
   ```

The server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure .env file**
   ```env
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

The app will open at `http://localhost:3000`

## 📚 API Documentation

### Authentication Routes

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Doe"
}

Response:
{
  "success": true,
  "token": "jwt_token",
  "user": { ... }
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}

Response:
{
  "success": true,
  "token": "jwt_token",
  "user": { ... }
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": { ... }
}
```

### Subscription Routes

#### Get All Subscriptions
```
GET /api/subscriptions?isActive=true
Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 5,
  "subscriptions": [ ... ]
}
```

#### Get Upcoming Subscriptions (next 7 days)
```
GET /api/subscriptions/upcoming?days=7
Authorization: Bearer {token}
```

#### Create Subscription
```
POST /api/subscriptions
Authorization: Bearer {token}
Content-Type: application/json

{
  "serviceName": "Netflix",
  "category": "OTT",
  "amount": 499,
  "billingCycle": "monthly",
  "startDate": "2024-01-29",
  "reminderDaysBefore": 3,
  "paymentMethod": "credit_card",
  "description": "Netflix Premium"
}

Response:
{
  "success": true,
  "subscription": { ... }
}
```

#### Update Subscription
```
PUT /api/subscriptions/{id}
Authorization: Bearer {token}
Content-Type: application/json

{ ... updated fields ... }
```

#### Mark as Paid
```
PUT /api/subscriptions/{id}/mark-paid
Authorization: Bearer {token}

Response:
{
  "success": true,
  "subscription": { ... }  // with updated nextDueDate
}
```

#### Delete Subscription
```
DELETE /api/subscriptions/{id}
Authorization: Bearer {token}
```

### Dashboard Routes

#### Get Dashboard Statistics
```
GET /api/dashboard/stats
Authorization: Bearer {token}

Response:
{
  "success": true,
  "stats": {
    "totalSubscriptions": 5,
    "upcomingBillsCount": 2,
    "overdueBillsCount": 0,
    "monthlyTotal": 2500,
    "estimatedMonthlyExpense": 2700,
    "upcomingBills": [ ... ],
    "monthlyData": [ ... ],
    "categoryBreakdown": [ ... ]
  }
}
```

#### Get Spending by Category
```
GET /api/dashboard/category-breakdown
Authorization: Bearer {token}
```

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salting (10 rounds)
- **JWT Authentication**: Token-based authentication
- **CORS Protection**: Configured CORS for frontend-only access
- **Input Validation**: express-validator for API requests
- **Error Handling**: Centralized error handling middleware
- **Protected Routes**: All sensitive routes require authentication

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-factor authentication on your Google Account
2. Generate an App Password for Gmail:
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Use the generated 16-character password in `.env`

### Other Email Services
Update `EMAIL_SERVICE` in `.env` to supported services:
- gmail
- outlook
- yahoo
- sendgrid
- etc.

## 🔄 Cron Job Configuration

### Reminder Check Schedule
Default: **Every day at 8:00 AM**

Located in: `server/cron/reminderService.js`

```javascript
// Current schedule
cron.schedule('0 8 * * *', async () => {
  // Runs daily at 8 AM
});
```

### For Development Testing
Uncomment the development schedule to run every 10 minutes:
```javascript
cron.schedule('*/10 * * * *', async () => {
  // Runs every 10 minutes
});
```

## 📊 Database Schema

### User Schema
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  emailNotificationsEnabled: Boolean,
  defaultReminderDays: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Subscription Schema
```javascript
{
  userId: ObjectId (ref: User),
  serviceName: String,
  category: String (enum),
  amount: Number,
  billingCycle: String ('monthly', 'yearly', 'custom'),
  nextDueDate: Date,
  reminderDaysBefore: Number,
  lastReminderSent: Date,
  lastPaidDate: Date,
  isActive: Boolean,
  isPaid: Boolean,
  renewalCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Sample Test Data

```javascript
// Sample subscription to create
{
  "serviceName": "Netflix",
  "description": "Video streaming service",
  "category": "OTT",
  "amount": 499,
  "currency": "INR",
  "billingCycle": "monthly",
  "startDate": "2024-01-29",
  "reminderDaysBefore": 3,
  "paymentMethod": "credit_card",
  "notes": "Premium plan with 4 screens"
}

// Sample user to register
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123456",
  "firstName": "Test",
  "lastName": "User"
}
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally: `mongod`
- Or update `MONGODB_URI` with MongoDB Atlas connection string
- Check credentials if using remote database

### Email Not Sending
- Verify email credentials in `.env`
- For Gmail, use App Password not regular password
- Check "Less secure app access" settings if needed

### CORS Error
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Typically `http://localhost:3000` for development

### JWT Token Expired
- Tokens expire in 7 days by default (configured via `JWT_EXPIRY`)
- User will be redirected to login when token expires

## 📈 Future Enhancements

- [ ] WhatsApp reminders via Twilio
- [ ] SMS notifications
- [ ] Dark mode UI
- [ ] Advanced analytics with graphs
- [ ] Recurring bill templates
- [ ] Family/shared subscriptions
- [ ] Multi-currency support
- [ ] Export to CSV/PDF
- [ ] Mobile app (React Native)
- [ ] Two-factor authentication (2FA)
- [ ] Bill splitting feature
- [ ] Payment integration (Stripe/PayPal)

## 📝 License

This project is licensed under the MIT License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.

---

## 🎯 Quick Reference

### Important Ports
- Backend: 5000
- Frontend: 3000
- MongoDB: 27017

### Commands Cheat Sheet
```bash
# Backend
cd server
npm install
npm run dev          # Start with nodemon
npm start            # Start production

# Frontend
cd client
npm install
npm start            # Start dev server
npm run build        # Build for production

# MongoDB (if local)
mongod              # Start MongoDB
mongo               # Connect to MongoDB
```

### Key Files to Customize
- `server/.env` - Backend configuration
- `client/.env` - Frontend configuration
- `server/cron/reminderService.js` - Cron schedule
- `server/utils/emailService.js` - Email templates

---

**Happy expense tracking! 📊💰**
