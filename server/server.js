/**
 * Smart Subscription & Bill Reminder System
 * Main Server File - Production Grade MongoDB Atlas Integration
 */

// ============================================
// CRITICAL: Load environment variables FIRST
// ============================================
require('dotenv').config();

// Suppress punycode deprecation warning
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return; // Suppress punycode warning
  }
  console.warn(warning);
});

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');
const { initializeCronJobs } = require('./cron/reminderService');
const { verifyTwilioCredentials } = require('./utils/whatsapp');

// ============================================
// DEBUG: Log environment loading
// ============================================
console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║             BILL REMINDER SERVER - STARTUP DEBUG           ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);
console.log('[ENV] PORT:', process.env.PORT);
console.log('[ENV] MONGODB_URI loaded:', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  console.log('[ENV] MongoDB URI format:', uri.substring(0, 40) + '...' + uri.substring(uri.length - 20));
}
console.log('[ENV] JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('');

// Initialize Express App
const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// MONGODB ATLAS CONNECTION - PRODUCTION GRADE
// ============================================

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('');
  console.error('❌ CRITICAL ERROR: MONGODB_URI not found in environment variables');
  console.error('   Check your .env file contains: MONGODB_URI=mongodb+srv://...');
  console.error('');
  process.exit(1);
}

// ============================================
// INITIALIZE DEMO & TESTER USERS
// ============================================

const initializeDemoUser = async () => {
  try {
    const User = global.User;
    if (!User) return;

    // Create demo user
    const demoUserExists = await User.findOne({ email: 'demo@example.com' });
    
    if (!demoUserExists) {
      console.log('[DEMO] Creating demo user...');
      await User.create({
        username: 'demouser',
        email: 'demo@example.com',
        password: 'password',
        firstName: 'Demo',
        lastName: 'User'
      });
      console.log('✅ [DEMO] Demo user created');
      console.log('   Email: demo@example.com | Password: password');
    } else {
      console.log('✅ [DEMO] Demo user already exists');
    }

    // Create tester user
    const testerUserExists = await User.findOne({ email: 'tester@example.com' });
    
    if (!testerUserExists) {
      console.log('[TESTER] Creating tester user...');
      await User.create({
        username: 'testuser',
        email: 'tester@example.com',
        password: 'tester123',
        firstName: 'Test',
        lastName: 'User'
      });
      console.log('✅ [TESTER] Tester user created');
      console.log('   Email: tester@example.com | Password: tester123');
    } else {
      console.log('✅ [TESTER] Tester user already exists');
    }
  } catch (error) {
    console.error('❌ [USERS] Failed to initialize users:', error.message);
  }
};

// ============================================
// MONGODB ATLAS CONNECTION - PRODUCTION GRADE
// ============================================

let dbConnected = false;

const connectDB = async () => {
  if (dbConnected) {
    console.log('[MONGO] Already connected, skipping...');
    return true;
  }

  try {
    console.log('[MONGO] Initiating connection to MongoDB Atlas...');
    console.log('[MONGO] Connection string (masked):', 
      MONGODB_URI.substring(0, 25) + '://***:***@' + 
      MONGODB_URI.substring(MONGODB_URI.indexOf('@') + 1)
    );

    // Production-grade mongoose configuration
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });

    dbConnected = true;
    console.log('✅ [MONGO] Successfully connected to MongoDB Atlas');
    console.log('✅ [MONGO] Database:', mongoose.connection.name);
    console.log('✅ [MONGO] Host:', mongoose.connection.host);
    
    // Initialize models ONCE after successful connection
    const { initializeModels } = require('./models');
    const models = initializeModels();
    global.User = models.User;
    global.Subscription = models.Subscription;
    
    console.log('✅ [MODELS] User model loaded');
    console.log('✅ [MODELS] Subscription model loaded');
    
    // Initialize demo user if it doesn't exist
    await initializeDemoUser();

    // Verify Twilio credentials for WhatsApp
    await verifyTwilioCredentials();
    
    return true;
  } catch (error) {
    dbConnected = false;
    console.error('');
    console.error('❌ [MONGO] Connection failed:', error.message);
    console.error('');
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 TROUBLESHOOTING:');
      console.error('   1. Check IP whitelist at https://cloud.mongodb.com/v2');
      console.error('   2. Navigate to Network Access → IP Whitelist');
      console.error('   3. Add your IP or use 0.0.0.0/0 (development only)');
      console.error('   4. Wait 1-2 minutes for whitelist to apply');
      console.error('   5. Verify credentials in MONGODB_URI');
      console.error('   6. Check if cluster is paused');
    } else if (error.name === 'MongoAuthenticationError') {
      console.error('💡 Auth failed - verify username/password in MONGODB_URI');
    } else if (error.name === 'MongoParseError') {
      console.error('💡 Invalid URI format - check connection string');
    }
    
    console.error('');
    throw error;
  }
};

// ============================================
// ROUTES & SERVER STARTUP
// ============================================

// Connect database and start server
(async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Load routes
    const authRoutes = require('./routes/authRoutes');
    const subscriptionRoutes = require('./routes/subscriptionRoutes');
    const dashboardRoutes = require('./routes/dashboardRoutes');

    // Register routes
    app.use('/api/auth', authRoutes);
    app.use('/api/subscriptions', subscriptionRoutes);
    app.use('/api/dashboard', dashboardRoutes);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        message: 'Smart Bill Reminder Server is running',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      });
    });

    // TEST ENDPOINT: Trigger WhatsApp reminders immediately
    app.post('/api/test/send-whatsapp-now', async (req, res) => {
      try {
        const { runReminderJob } = require('./cron/reminderService');
        console.log('[TEST] Manual WhatsApp trigger requested');
        await runReminderJob();
        res.json({
          success: true,
          message: 'WhatsApp job executed. Check server logs and WhatsApp.'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });

    // Global error handler
    app.use(errorHandler);

    // Initialize email reminder cron job (runs every hour)
    initializeCronJobs();

    // Start listening
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║  Smart Subscription & Bill Reminder - WhatsApp Edition    ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ MongoDB: Connected and ready`);
      console.log('');
    });

  } catch (error) {
    console.error('');
    console.error('❌ FATAL: Failed to start server');
    console.error('Error:', error.message);
    console.error('');
    // Only exit once on startup failure to prevent nodemon loops
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
})();

module.exports = app;
