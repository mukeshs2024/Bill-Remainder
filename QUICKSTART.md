# ⚡ Quick Start Guide

## 🚀 Start in 5 Minutes

### Prerequisites
- Node.js installed
- MongoDB running (local or Atlas account)

### Terminal 1: Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and email credentials
npm install
npm run dev
```
✅ Backend runs on http://localhost:5000

### Terminal 2: Frontend Setup
```bash
cd client
cp .env.example .env
npm install
npm start
```
✅ Frontend opens at http://localhost:3000

### Terminal 3: MongoDB (if using local)
```bash
mongod
```

## 🔑 Test Credentials

### Create Account
- Go to http://localhost:3000/register
- Fill in the form and create account

### Or Login with Test Account (if you added sample data)
- Email: `test@example.com`
- Password: `TestPassword123`

## 📋 First Steps

1. ✅ Register or login
2. ✅ Click "+ Add Subscription"
3. ✅ Fill in subscription details (e.g., Netflix - ₹499/month)
4. ✅ View dashboard with stats
5. ✅ Set reminders and monitor bills

## 🔧 Configuration Files

### Backend `.env`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bill-reminder
JWT_SECRET=your_secret_key_here
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env`
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Complete project documentation |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Detailed setup instructions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design and architecture |
| [SAMPLE_DATA.md](./SAMPLE_DATA.md) | Test data and API examples |

## 🎯 Key Features

✅ User authentication with JWT
✅ Add, edit, delete subscriptions
✅ Track upcoming bills
✅ Mark bills as paid
✅ Email reminders (configurable)
✅ Dashboard with analytics
✅ Category-wise spending breakdown
✅ Responsive design
✅ Monthly expense tracking

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123",
    "firstName": "Test"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

Use the returned token for subsequent requests:
```bash
curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Postman Collection

Import `Bill_Reminder_API.postman_collection.json` into Postman for easy API testing.

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| MongoDB connection failed | Ensure `mongod` is running or update `MONGODB_URI` in `.env` |
| CORS error | Verify `FRONTEND_URL` in backend `.env` matches your frontend URL |
| Email not sending | Use Gmail App Password, not regular password |
| Port already in use | Change PORT in `.env` (e.g., 5001) |
| npm install fails | Delete node_modules, run `npm cache clean --force`, then `npm install` |

## 📁 Project Structure

```
Bill Remainder/
├── server/               # Backend (Express + Node.js)
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & error handling
│   ├── utils/           # Email & JWT utilities
│   ├── cron/            # Scheduled reminders
│   ├── .env.example     # Environment template
│   └── server.js        # Main server file
│
├── client/              # Frontend (React + Tailwind)
│   ├── src/
│   │   ├── pages/       # Login, Register, Dashboard, etc.
│   │   ├── components/  # Navigation, etc.
│   │   ├── services/    # API client
│   │   ├── App.jsx      # Main component
│   │   └── index.css    # Tailwind styles
│   ├── public/
│   ├── package.json
│   └── .env.example     # Environment template
│
├── README.md            # Full documentation
├── SETUP_GUIDE.md       # Detailed setup steps
├── ARCHITECTURE.md      # System design
└── SAMPLE_DATA.md       # Test data & examples
```

## 🎓 Learning Resources

- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Node.js Best Practices](https://nodejs.org/docs/)

## 🚀 Next Steps

1. **Add Sample Data**: Use SAMPLE_DATA.md to add test subscriptions
2. **Configure Email**: Set up Gmail App Password for email reminders
3. **Customize Cron**: Adjust reminder schedule in `server/cron/reminderService.js`
4. **Deploy**: Push to GitHub, deploy to Heroku/AWS
5. **Enhance**: Add features like WhatsApp notifications, charts, etc.

## 💡 Pro Tips

- Use Postman for API testing
- Check browser console for frontend errors
- Check terminal for backend logs
- Use `npm run dev` in backend for auto-reload (with nodemon)
- MongoDB Atlas is great for cloud database
- Gmail App Passwords work best for email service

## 📞 Need Help?

1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed steps
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Check error logs in terminal
4. Verify all `.env` files are configured correctly

## 🎉 You're All Set!

Your Smart Bill Reminder System is ready to use. Start by:
1. Creating subscriptions
2. Setting up email reminders
3. Tracking your monthly expenses

Enjoy managing your bills! 📊💰

---

**Happy coding!** 🚀

For complete documentation, see [README.md](./README.md)
