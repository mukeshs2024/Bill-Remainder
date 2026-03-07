const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Internet', 'Loan', 'Insurance', 'Subscription', 'Other'],
    required: true
  },
  // ============================================================
  // UNIVERSAL FIELDS (All categories)
  // ============================================================
  amount: {
    type: Number,
    required: true,
    description: 'Recurring amount (Subscription/Internet) OR EMI amount (Loan) OR Premium (Insurance)'
  },
  cycle: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly',
    description: 'Billing cycle - auto-set by category'
  },
  startDate: {
    type: Date,
    required: true,
    description: 'Billing start date (immutable)'
  },
  nextDueDate: {
    type: Date,
    required: true,
    description: 'Next payment due date (auto-calculated by backend)'
  },
  expiryDate: {
    type: Date,
    default: null,
    description: 'Reminder cutoff date (user-provided)'
  },
  
  // ============================================================
  // LOAN-SPECIFIC FIELDS
  // ============================================================
  totalAmount: {
    type: Number,
    default: null,
    description: 'Total loan amount (Loan category only)'
  },
  emiAmount: {
    type: Number,
    default: null,
    description: 'Monthly EMI amount (Loan category only)'
  },
  tenureMonths: {
    type: Number,
    default: null,
    description: 'Loan tenure in months (Loan category only)'
  },
  remainingAmount: {
    type: Number,
    default: null,
    description: 'Outstanding loan balance (Loan category only)'
  },
  endDate: {
    type: Date,
    default: null,
    description: 'Auto-calculated loan end date (Loan category only)'
  },
  
  // ============================================================
  // INSURANCE-SPECIFIC FIELDS
  // ============================================================
  provider: {
    type: String,
    default: null,
    description: 'Service provider name (Insurance/Internet/Telecom)'
  },
  policyNumber: {
    type: String,
    default: null,
    description: 'Insurance policy number'
  },
  coverageAmount: {
    type: Number,
    default: null,
    description: 'Insurance coverage amount'
  },
  renewalType: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', null],
    default: null,
    description: 'Insurance renewal frequency'
  },
  
  // ============================================================
  // INTERNET-SPECIFIC FIELDS
  // ============================================================
  planName: {
    type: String,
    default: null,
    description: 'Internet/Broadband plan name'
  },
  speedMbps: {
    type: Number,
    default: null,
    description: 'Internet speed in Mbps'
  },
  
  // ============================================================
  // UNIVERSAL PAYMENT TRACKING
  // ============================================================
  lastPaidDate: {
    type: Date,
    description: 'Last payment date (used for Internet and EMI tracking)'
  },
  
  // ============================================================
  // NOTIFICATION SETTINGS
  // ============================================================
  remindBefore: {
    type: Number,
    default: 3,
    description: 'Days before due date to send reminder'
  },
  whatsappPhone: {
    type: String,
    default: null,
    description: 'WhatsApp phone number for notifications'
  },
  
  // ============================================================
  // METADATA
  // ============================================================
  notes: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'upi', 'bank_transfer', 'cash'],
    default: 'credit_card'
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Expired', 'Completed'],
    default: 'Active',
    description: 'Completed for loans when remainingAmount <= 0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  email: {
    type: String,
    required: true
  },
  lastPaidDate: {
    type: Date,
    description: 'Last payment date (used for EMI tracking)'
  },
  paidCount: {
    type: Number,
    default: 0,
    description: 'Number of EMI payments made (Loan only)'
  },
  paymentHistory: {
    type: [{
      amount: { type: Number, required: true },
      paidAt: { type: Date, default: Date.now },
      note: { type: String, default: '' }
    }],
    default: [],
    description: 'Record of all payments made'
  },
  lastReminderSent: {
    type: Date
  },
  remindersSent: {
    type: [Number],
    default: [],
    description: 'Array of days when reminders were sent'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Update updatedAt before save
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
subscriptionSchema.index({ userId: 1, category: 1, status: 1 });
subscriptionSchema.index({ userId: 1, nextDueDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
