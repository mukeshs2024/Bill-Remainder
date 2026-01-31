const mongoose = require('mongoose');
const Subscription = require('./server/models/Subscription');
require('dotenv').config({ path: './server/.env' });

async function updateSubscriptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[DB] Connected to MongoDB');

    // Find all subscriptions without endDate
    const subscriptionsWithoutEndDate = await Subscription.find({ 
      endDate: { $exists: false } 
    });

    console.log(`\n[UPDATE] Found ${subscriptionsWithoutEndDate.length} subscriptions without endDate`);

    if (subscriptionsWithoutEndDate.length === 0) {
      console.log('[UPDATE] All subscriptions already have endDate!');
      await mongoose.disconnect();
      return;
    }

    // Set endDate to 7 days from today for each
    const today = new Date();
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const result = await Subscription.updateMany(
      { endDate: { $exists: false } },
      { $set: { endDate: endDate } }
    );

    console.log(`\n[UPDATE] ✅ Updated ${result.modifiedCount} subscriptions`);
    console.log(`[UPDATE] EndDate set to: ${endDate.toISOString()}`);

    // Show updated subscriptions
    const updated = await Subscription.find({ isActive: true }).limit(5);
    console.log(`\n[CHECK] Sample subscriptions:`);
    for (const sub of updated) {
      console.log(`  - ${sub.serviceName} | Expires: ${sub.endDate}`);
    }

    await mongoose.disconnect();
    console.log('\n[DB] Disconnected from MongoDB');
    console.log('\n✅ Done! Emails will now send at 9:46 PM IST');

  } catch (error) {
    console.error('[ERROR]', error.message);
    process.exit(1);
  }
}

updateSubscriptions();
