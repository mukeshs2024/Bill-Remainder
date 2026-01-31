const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'other'
  },
  amount: {
    type: Number,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'custom'],
    default: 'monthly'
  },
  billingCycleDays: {
    type: Number,
    default: 30
  },
  startDate: {
    type: Date,
    required: true
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  reminderDaysBefore: {
    type: Number,
    default: 3
  },
  paymentMethod: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastPaidDate: {
    type: Date
  },
  lastReminderSent: {
    type: Date
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: null,
    description: 'WhatsApp phone number in E.164 format: +91...'
  },
  endDate: {
    type: Date,
    required: true
  },
  remindersSent: {
    type: [Number],
    default: [],
    description: 'Array of days when reminders were sent: [7, 3, 2, 1, 0, -1]'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before save
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to calculate next due date
subscriptionSchema.methods.calculateNextDueDate = function() {
  let nextDate = new Date(this.startDate);
  
  if (this.billingCycle === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (this.billingCycle === 'yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else if (this.billingCycle === 'custom' && this.billingCycleDays) {
    nextDate.setDate(nextDate.getDate() + this.billingCycleDays);
  }
  
  return nextDate;
};

// Instance method to check if reminder should be sent
subscriptionSchema.methods.shouldSendReminder = function() {
  if (!this.isActive) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (this.lastReminderSent) {
    const lastReminder = new Date(this.lastReminderSent);
    lastReminder.setHours(0, 0, 0, 0);
    if (lastReminder.getTime() === today.getTime()) {
      return false;
    }
  }
  
  const dueDate = new Date(this.nextDueDate);
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - this.reminderDaysBefore);
  
  return today >= reminderDate && today <= dueDate;
};

// Instance method to mark as paid
subscriptionSchema.methods.markAsPaid = function() {
  this.lastPaidDate = new Date();
  this.nextDueDate = this.calculateNextDueDate();
  return this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
