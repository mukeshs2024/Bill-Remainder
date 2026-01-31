#!/usr/bin/env node

/**
 * Test Script: Create Subscription & Test Email Reminders
 * Run from server directory: node test-subscription.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

// Helper to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     Test: Create Subscription & Email Reminder System      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Login
    console.log('[1] Login with demo user...');
    const loginResp = await makeRequest('POST', '/auth/login', {
      email: 'demo@example.com',
      password: 'password'
    });

    if (loginResp.status !== 200) {
      throw new Error(`Login failed: ${loginResp.data.message}`);
    }

    const token = loginResp.data.token;
    const userId = loginResp.data.user._id;
    console.log('✅ Login successful');
    console.log(`   User: ${loginResp.data.user.email}`);
    console.log(`   Token: ${token.substring(0, 20)}...\n`);

    // Step 2: Create subscription with endDate (TOMORROW)
    console.log('[2] Creating subscription with endDate = tomorrow...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const subscriptionData = {
      serviceName: 'Netflix Test Subscription',
      description: 'Testing email reminder system',
      category: 'entertainment',
      amount: 499,
      billingCycle: 'monthly',
      startDate: '2024-01-01',
      endDate: tomorrowStr,
      reminderDaysBefore: 1,
      paymentMethod: 'credit card',
      notes: 'Test subscription - expect email tomorrow'
    };

    const subResp = await makeRequest('POST', '/subscriptions', subscriptionData, token);

    if (subResp.status !== 201) {
      throw new Error(`Create subscription failed: ${subResp.data.message || JSON.stringify(subResp.data)}`);
    }

    const subscription = subResp.data.subscription;
    console.log('✅ Subscription created successfully');
    console.log(`   ID: ${subscription._id}`);
    console.log(`   Service: ${subscription.serviceName}`);
    console.log(`   Amount: ₹${subscription.amount}`);
    console.log(`   End Date: ${new Date(subscription.endDate).toLocaleDateString()}`);
    console.log(`   Email: ${subscription.email}`);
    console.log(`   lastNotified: ${subscription.lastNotified}\n`);

    // Step 3: Verify in database
    console.log('[3] Subscription created and saved in MongoDB');
    console.log('   Next reminder email will be sent at 9:00 AM daily\n');

    // Step 4: Instructions
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    NEXT STEPS                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('To test emails immediately (instead of waiting for 9 AM):\n');
    console.log('1. Edit /server/cron/reminderCron.js');
    console.log('   Change line 36 from:  cron.schedule(\'0 9 * * *\', async () => {');
    console.log('   To:                   cron.schedule(\'*/1 * * * *\', async () => {');
    console.log('   (This makes it run every 1 minute instead of 9 AM)\n');
    
    console.log('2. Restart server: npm run dev\n');
    
    console.log('3. Wait 1 minute and check:');
    console.log('   a) Server logs for: [CRON] Processing 1 active subscriptions');
    console.log('   b) Email inbox for reminder email');
    console.log('   c) Database lastNotified should change from null to 1\n');
    
    console.log('4. When done testing, reset the cron schedule back to \'0 9 * * *\'\n');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                 SUBSCRIPTION CREATED ✓                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Check if server is running
http.get('http://localhost:5000/api/health', (res) => {
  if (res.statusCode === 200) {
    test();
  }
}).on('error', () => {
  console.error('\n❌ Server not running on http://localhost:5000');
  console.error('   Start with: npm run dev\n');
  process.exit(1);
});
