/**
 * Database Seed Script
 * Creates demo users for testing
 */

require('dotenv').config();
const path = require('path');
const { Sequelize } = require('sequelize');

// Initialize Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../data/bill-reminder.db'),
  logging: false,
});

// Initialize models
const { initializeModels } = require('./models');
const { User } = initializeModels(sequelize);

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');

    await sequelize.sync({ alter: true });
    console.log('✓ Database synced');

    // Delete existing demo users
    await User.destroy({
      where: {
        email: ['demo@example.com', 'test@example.com']
      }
    });

    // Create demo user (password will be hashed by beforeCreate hook)
    const demoUser = await User.create({
      username: 'demouser',
      email: 'demo@example.com',
      password: 'Demo@123456',  // Plain password - will be hashed by hook
      firstName: 'Demo',
      lastName: 'User',
      emailNotificationsEnabled: true,
      defaultReminderDays: 3
    });

    console.log('✓ Demo user created successfully');
    console.log(`  Email: demo@example.com`);
    console.log(`  Password: Demo@123456`);

    // Create additional demo user
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@123456',  // Plain password - will be hashed by hook
      firstName: 'Test',
      lastName: 'User',
      emailNotificationsEnabled: true,
      defaultReminderDays: 3
    });

    console.log('✓ Test user created successfully');
    console.log(`  Email: test@example.com`);
    console.log(`  Password: Test@123456`);

    console.log('\n✓ Database seeding completed!');
    await sequelize.close();
  } catch (error) {
    console.error('✗ Seeding error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
