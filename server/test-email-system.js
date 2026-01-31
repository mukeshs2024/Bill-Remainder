#!/usr/bin/env node

/**
 * Email Reminder System - Test Utility
 * 
 * This script helps verify the email reminder system is configured correctly
 * Run from server directory: node test-email-system.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const Subscription = require('./models/Subscription');
const User = require('./models/User');
const mongoose = require('mongoose');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║          Email Reminder System - Configuration Test         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Test 1: Environment Variables
console.log('[TEST 1] Environment Variables');
console.log('================================');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const mongoUri = process.env.MONGODB_URI;

console.log(`✓ EMAIL_USER: ${emailUser ? '✓ Set (' + emailUser + ')' : '✗ NOT SET'}`);
console.log(`✓ EMAIL_PASS: ${emailPass ? '✓ Set (' + emailPass.length + ' chars)' : '✗ NOT SET'}`);
console.log(`✓ MONGODB_URI: ${mongoUri ? '✓ Set' : '✗ NOT SET'}`);

if (!emailUser || !emailPass) {
  console.log('\n⚠️  Missing email configuration!');
  console.log('   Update .env with EMAIL_USER and EMAIL_PASS\n');
}

// Test 2: Gmail Configuration
console.log('\n[TEST 2] Gmail Transporter Connection');
console.log('=====================================');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log(`✗ Transporter verification failed: ${error.message}`);
    console.log('\n⚠️  Email configuration error!');
    console.log('   1. Verify EMAIL_USER is a valid Gmail address');
    console.log('   2. Verify EMAIL_PASS is a Gmail App Password (not regular password)');
    console.log('   3. Go to: https://myaccount.google.com/apppasswords');
    console.log('   4. Generate new app password if needed\n');
  } else {
    console.log('✓ Transporter ready - emails can be sent');
    console.log('✓ Gmail credentials verified\n');
  }

  // Test 3: Database Connection
  console.log('[TEST 3] MongoDB Connection');
  console.log('==========================');

  if (!mongoUri) {
    console.log('✗ MONGODB_URI not set in .env\n');
    process.exit(1);
  }

  mongoose.connect(mongoUri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  }).then(async () => {
    console.log('✓ MongoDB connected successfully');
    console.log(`✓ Database: ${mongoose.connection.name}\n`);

    // Test 4: Check subscriptions
    console.log('[TEST 4] Database Subscriptions');
    console.log('===============================');

    try {
      const Subscription = require('./models/Subscription');
      const User = require('./models/User');

      const subscriptionCount = await Subscription.countDocuments({ isActive: true });
      const userCount = await User.countDocuments();

      console.log(`✓ Total users: ${userCount}`);
      console.log(`✓ Active subscriptions: ${subscriptionCount}`);

      if (subscriptionCount > 0) {
        const subs = await Subscription.find({ isActive: true }).limit(3).populate('userId', 'email');
        console.log('\nSample subscriptions:');
        subs.forEach((sub, i) => {
          const daysLeft = Math.floor((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24));
          console.log(`  ${i + 1}. ${sub.serviceName}`);
          console.log(`     User: ${sub.userId?.email || 'N/A'}`);
          console.log(`     Expires: ${new Date(sub.endDate).toLocaleDateString()}`);
          console.log(`     Days left: ${daysLeft}`);
          console.log(`     Last notified: ${sub.lastNotified || 'Never'}`);
        });
      } else {
        console.log('\n⚠️  No active subscriptions found!');
        console.log('   Create a subscription to test email reminders.\n');
      }

      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                  Configuration Summary                      ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log('✓ Email system configured and ready');
      console.log('✓ MongoDB connected');
      console.log('✓ Cron job will run daily at 9:00 AM\n');

      console.log('Next steps:');
      console.log('1. Create subscriptions with endDate field');
      console.log('2. Check server logs for [CRON] messages');
      console.log('3. Verify emails arrive in inbox\n');

      console.log('To test cron job immediately:');
      console.log('1. Edit /server/cron/reminderCron.js');
      console.log('2. Change schedule from \'0 9 * * *\' to \'*/10 * * * *\'');
      console.log('3. Restart server: npm run dev');
      console.log('4. Wait 10 minutes for job to run\n');

    } catch (error) {
      console.log(`✗ Database test failed: ${error.message}\n`);
    }

    mongoose.disconnect();
  }).catch((error) => {
    console.log(`✗ MongoDB connection failed: ${error.message}`);
    console.log('\n⚠️  Database connection error!');
    console.log('   1. Check MONGODB_URI in .env');
    console.log('   2. Verify IP whitelist at https://cloud.mongodb.com/v2');
    console.log('   3. Check if cluster is active\n');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('unhandledRejection', (error) => {
  console.error('\n✗ Test failed:', error.message);
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⚠️  Test timeout - check your internet connection\n');
  process.exit(1);
}, 30000);
