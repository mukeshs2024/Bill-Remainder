# 📖 Complete Setup Guide

## Prerequisites

Before you start, ensure you have the following installed:

### Required Software
1. **Node.js** (v14.0.0 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **MongoDB** (Local or Cloud)
   - **Local MongoDB**: https://www.mongodb.com/try/download/community
   - **MongoDB Atlas (Cloud)**: https://www.mongodb.com/cloud/atlas
   - Verify: `mongod --version` (for local installation)

3. **Git** (Optional, for cloning)
   - Download: https://git-scm.com/

4. **Code Editor** (Any of these)
   - VS Code: https://code.visualstudio.com/
   - WebStorm, IntelliJ IDEA, etc.

## Step-by-Step Setup

### Phase 1: Database Setup

#### Option A: MongoDB Local Installation
1. Install MongoDB Community Edition
2. Start MongoDB service:
   - **Windows**: `mongod` in terminal
   - **macOS**: `brew services start mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

#### Option B: MongoDB Atlas (Recommended for Production)
1. Visit https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Add your IP address to the access list
5. Create a database user
6. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/bill-reminder
   ```

### Phase 2: Backend Setup

#### Step 1: Navigate to Server Directory
```bash
cd server
```

#### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- express (web framework)
- mongoose (MongoDB ODM)
- jsonwebtoken (JWT auth)
- bcryptjs (password hashing)
- nodemailer (email service)
- dotenv (environment variables)
- cors (cross-origin requests)
- node-cron (scheduled tasks)

#### Step 3: Create Environment File
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values
```

#### Step 4: Configure .env File

Open `server/.env` and update with your settings:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# Local:
MONGODB_URI=mongodb://localhost:27017/bill-reminder

# Or MongoDB Atlas (replace with your credentials):
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bill-reminder

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRY=7d

# Email Configuration (Gmail Example)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Step 5: Configure Gmail for Email (If Using Gmail)

1. Go to your Google Account: https://myaccount.google.com/
2. Select "Security" from the left menu
3. Enable "2-Step Verification" (if not already enabled)
4. Go back to Security and look for "App passwords"
5. Select "Mail" and "Windows Computer"
6. Google will generate a 16-character password
7. Copy this password to `EMAIL_PASSWORD` in `.env`

#### Step 6: Start Backend Server
```bash
# Development (with auto-reload)
npm run dev

# Or production
npm start
```

Expected output:
```
╔══════════════════════════════════════════════════════════╗
║  Smart Subscription & Bill Reminder System - Server v1.0 ║
╚══════════════════════════════════════════════════════════╝
✓ Server running on http://localhost:5000
✓ Environment: development
✓ MongoDB connected successfully
```

### Phase 3: Frontend Setup

#### Step 1: Open New Terminal and Navigate to Client
```bash
cd client
```

#### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- react & react-dom (UI framework)
- react-router-dom (routing)
- axios (HTTP client)
- tailwindcss (styling)
- chart.js (charts)
- lucide-react (icons)

#### Step 3: Create Environment File
```bash
cp .env.example .env
```

#### Step 4: Configure .env File

Open `client/.env`:
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

#### Step 5: Start Frontend Server
```bash
npm start
```

The app will automatically open at `http://localhost:3000`

### Phase 4: Verification

#### Test the Application

1. **Check Backend Health**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"ok","message":"Smart Bill Reminder Server is running"}`

2. **Register a New Account**
   - Go to http://localhost:3000/register
   - Create a test account
   - Use any email (emails work locally without actual sending)

3. **Login**
   - Go to http://localhost:3000/login
   - Use your test credentials

4. **Add a Subscription**
   - Click "+ Add New Subscription"
   - Fill in the form with test data
   - Click "Add Subscription"

5. **View Dashboard**
   - Should see your subscription in the dashboard
   - Check upcoming bills and statistics

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment type | development |
| MONGODB_URI | Database connection | mongodb://localhost:27017/bill-reminder |
| JWT_SECRET | JWT signing key | your_super_secret_key |
| JWT_EXPIRY | Token expiration | 7d |
| EMAIL_SERVICE | Email provider | gmail |
| EMAIL_USER | Email address | your@gmail.com |
| EMAIL_PASSWORD | Email password | app_password |
| FRONTEND_URL | Frontend origin | http://localhost:3000 |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_API_BASE_URL | API endpoint | http://localhost:5000/api |

## Troubleshooting

### Problem: MongoDB Connection Failed
**Solution:**
- Ensure MongoDB is running: `mongod`
- Check connection string in .env
- If using Atlas, verify IP whitelist and credentials

### Problem: CORS Error in Console
**Solution:**
- Check FRONTEND_URL in backend .env (should be http://localhost:3000)
- Restart backend server

### Problem: Email Not Sending
**Solution:**
- Verify EMAIL_USER and EMAIL_PASSWORD are correct
- For Gmail, use App Password, not regular password
- Check email service configuration

### Problem: Port Already in Use
**Solution:**
- Backend (5000): `netstat -ano | findstr :5000` on Windows
- Change PORT in .env to an unused port like 5001
- Frontend (3000): Change in package.json scripts or use `PORT=3001 npm start`

### Problem: npm install fails
**Solution:**
- Delete node_modules and package-lock.json
- Run `npm cache clean --force`
- Run `npm install` again

## Production Deployment

### Important Security Changes for Production

1. **Update JWT_SECRET**
   ```bash
   # Generate a secure random key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update NODE_ENV**
   ```env
   NODE_ENV=production
   ```

3. **Use Strong Password Hashing**
   - Already implemented with bcryptjs (10 rounds)

4. **Enable HTTPS**
   - Use Cloudflare, Nginx, or Let's Encrypt

5. **Database Security**
   - Use MongoDB Atlas with IP whitelisting
   - Create separate DB users for each environment

6. **Email Security**
   - Use dedicated email service (SendGrid, Mailgun, etc.)
   - Never commit .env files to git

7. **Frontend Build**
   ```bash
   cd client
   npm run build
   # Deploy build/ folder to static hosting
   ```

## Useful Commands

### Backend
```bash
# Install dependencies
npm install

# Development (watch mode)
npm run dev

# Production start
npm start

# Clear MongoDB (careful!)
# mongo admin --eval "db.dropDatabase()"
```

### Frontend
```bash
# Install dependencies
npm install

# Development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### MongoDB
```bash
# Start MongoDB (if local)
mongod

# Connect to MongoDB
mongo

# List databases
show dbs

# Use a database
use bill-reminder

# List collections
show collections

# View users
db.users.find()

# View subscriptions
db.subscriptions.find()
```

## Next Steps

1. ✅ Complete setup
2. ✅ Test with sample data
3. ⏭️ Add more subscriptions
4. ⏭️ Customize reminder schedule in cron/reminderService.js
5. ⏭️ Deploy to production (Heroku, AWS, DigitalOcean, etc.)
6. ⏭️ Add WhatsApp notifications (Twilio)
7. ⏭️ Implement payment gateway integration

## Support Resources

- **Express.js Documentation**: https://expressjs.com/
- **MongoDB Documentation**: https://docs.mongodb.com/
- **React Documentation**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Node.js Documentation**: https://nodejs.org/docs/

---

Happy coding! 🚀
