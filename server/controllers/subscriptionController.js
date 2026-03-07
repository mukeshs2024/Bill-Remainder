const { sendReminderEmail } = require('../utils/emailService');
const { addMonthsSafe, calculateLoanEndDate, calculateNextDueDate, calculatePaymentProgress, isLoanPaid, getInsuranceNextDueDate, getInsuranceRenewalDate } = require('../utils/dateUtils');

/**
 * Subscription Controller
 * Handles all subscription and loan management operations
 * 
 * Categories:
 * - Subscription/Internet: Recurring indefinitely
 * - Loan: Amortized with EMI payments
 * - Insurance: Annual renewal
 * - Other: Manual reminder
 */

/**
 * Get all subscriptions for the authenticated user
 */
exports.getAllSubscriptions = async (req, res, next) => {
  try {
    const { Subscription } = global;
    const { isActive } = req.query;
    
    // Build filter
    const filter = { userId: req.userId };
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }

    const subscriptions = await Subscription.find(filter).sort({ nextDueDate: 1 });

    res.status(200).json({
      success: true,
      subscriptions: subscriptions,
      count: subscriptions.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upcoming subscriptions (next 7 days by default)
 */
exports.getUpcomingSubscriptions = async (req, res, next) => {
  try {
    const { Subscription } = global;
    const { days = 7 } = req.query;
    const today = new Date();
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + parseInt(days));

    const subscriptions = await Subscription.find({
      userId: req.userId,
      isActive: true,
      nextDueDate: {
        $gte: today,
        $lte: upcomingDate
      }
    }).sort({ nextDueDate: 1 });

    res.status(200).json({
      success: true,
      data: subscriptions,
      count: subscriptions.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue subscriptions
 */
exports.getOverdueSubscriptions = async (req, res, next) => {
  try {
    const { Subscription } = global;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subscriptions = await Subscription.find({
      userId: req.userId,
      isActive: true,
      nextDueDate: { $lt: today }
    }).sort({ nextDueDate: 1 });

    res.status(200).json({
      success: true,
      data: subscriptions,
      count: subscriptions.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription by ID
 */
exports.getSubscriptionById = async (req, res, next) => {
  try {
    const { Subscription } = global;
    const { id } = req.params;

    const subscription = await Subscription.findOne({
      _id: id,
      userId: req.userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      subscription: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new subscription
 * Handles all categories with category-specific logic
 * 
 * SaaS Architecture:
 * - Backend controls nextDueDate (NEVER from frontend)
 * - Category drives billing cycle and required fields
 * - expiryDate stored as-is (reminder cutoff only)
 */
exports.createSubscription = async (req, res, next) => {
  try {
    const { Subscription, User } = global;
    const {
      name,
      description,
      category,
      amount,
      cycle,
      startDate,
      expiryDate,
      remindBefore,
      whatsappPhone,
      notes,
      paymentMethod,
      // LOAN-SPECIFIC FIELDS
      totalAmount,
      emiAmount,
      tenureMonths,
      // INSURANCE-SPECIFIC FIELDS
      provider,
      policyNumber,
      coverageAmount,
      // INTERNET-SPECIFIC FIELDS
      planName,
      speedMbps
    } = req.body;

    // Basic validation
    if (!name || !category || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and start date are required'
      });
    }

    // Category-specific validation
    if (category === 'Loan') {
      if (!totalAmount || !emiAmount || !tenureMonths) {
        return res.status(400).json({
          success: false,
          message: 'Loan requires: totalAmount, emiAmount, and tenureMonths'
        });
      }
    } else if (category === 'Insurance') {
      if (!expiryDate) {
        return res.status(400).json({
          success: false,
          message: 'Insurance requires: expiryDate (mandatory)'
        });
      }
      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Insurance premium amount is required'
        });
      }
    } else if (category === 'Internet') {
      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Internet monthly amount is required'
        });
      }
    } else {
      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Amount is required'
        });
      }
    }

    // Get user email
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ============================================================
    // CATEGORY-DRIVEN CYCLE OVERRIDE
    // ============================================================
    let finalCycle = cycle;
    
    if (category === 'Internet' || category === 'Loan') {
      finalCycle = 'monthly';
    } else if (category === 'Insurance') {
      finalCycle = 'yearly';
    } else if (category === 'Other' || category === 'Subscription') {
      finalCycle = cycle || 'monthly';
    }

    console.log(`[SUBSCRIPTION] Category: ${category} → Cycle: ${finalCycle}`);

    // ============================================================
    // AUTO-CALCULATE nextDueDate (BACKEND ONLY)
    // ============================================================
    const start = new Date(startDate);
    let nextDueDate;

    // INSURANCE: nextDueDate = expiryDate (renewal due on expiry)
    if (category === 'Insurance') {
      nextDueDate = new Date(expiryDate);
      console.log(`[INSURANCE] Created:`);
      console.log(`  Premium: ₹${amount}`);
      console.log(`  Policy: ${policyNumber}`);
      console.log(`  Coverage: ₹${coverageAmount}`);
      console.log(`  Expiry: ${nextDueDate.toDateString()}`);
    } 
    // INTERNET: Always monthly, nextDueDate = startDate + 1 month
    else if (category === 'Internet') {
      nextDueDate = calculateNextDueDate(start, 'monthly');
      console.log(`[INTERNET] Created:`);
      console.log(`  Provider: ${provider}`);
      console.log(`  Plan: ${planName}`);
      console.log(`  Speed: ${speedMbps} Mbps`);
      console.log(`  Monthly: ₹${amount}`);
      console.log(`  Next Due: ${nextDueDate.toDateString()}`);
    }
    // LOAN/SUBSCRIPTION/OTHER: Based on cycle
    else {
      nextDueDate = calculateNextDueDate(start, finalCycle);
    }

    // ============================================================
    // CATEGORY-SPECIFIC FIELD SETUP
    // ============================================================
    let loanFields = {};
    let insuranceFields = {};
    let internetFields = {};
    let initialStatus = 'Active';

    if (category === 'Loan') {
      const total = Number(totalAmount);
      const emi = Number(emiAmount);
      const months = Number(tenureMonths);
      
      // Calculate loan end date
      const endDate = calculateLoanEndDate(start, months);
      
      loanFields = {
        totalAmount: total,
        emiAmount: emi,
        tenureMonths: months,
        remainingAmount: total,
        endDate: endDate,
        amount: emi, // Store EMI as amount for compatibility
        paidCount: 0
      };

      console.log(`[LOAN] Created:`);
      console.log(`  Principal: ₹${total}`);
      console.log(`  EMI: ₹${emi}`);
      console.log(`  Tenure: ${months} months`);
      console.log(`  End Date: ${endDate.toDateString()}`);
    } else if (category === 'Insurance') {
      insuranceFields = {
        provider: provider || null,
        policyNumber: policyNumber || null,
        coverageAmount: Number(coverageAmount) || null,
        renewalType: 'yearly',
        amount: Number(amount),
        cycle: 'yearly'
      };
    } else if (category === 'Internet') {
      internetFields = {
        provider: provider || null,
        planName: planName || null,
        speedMbps: Number(speedMbps) || null,
        amount: Number(amount),
        cycle: 'monthly'
      };
    }

    // ============================================================
    // BUILD SUBSCRIPTION OBJECT
    // ============================================================
    const subscriptionData = {
      userId: req.userId,
      name,
      description: description || '',
      category,
      
      // BILLING DATES
      startDate: start,
      nextDueDate: nextDueDate,  // AUTO-CALCULATED
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      
      // BILLING INFO
      cycle: category === 'Insurance' ? 'yearly' : category === 'Internet' ? 'monthly' : finalCycle,
      amount: category === 'Loan' ? Number(emiAmount) : Number(amount),
      
      // NOTIFICATIONS
      remindBefore: remindBefore || 3,
      whatsappPhone: whatsappPhone || null,
      
      // METADATA
      notes: notes || '',
      paymentMethod: paymentMethod || 'credit_card',
      status: initialStatus,
      email: user.email,
      
      // INSURANCE FIELDS
      ...insuranceFields,
      
      // INTERNET FIELDS
      ...internetFields,
      
      // LOAN FIELDS
      ...loanFields
    };

    const subscription = await Subscription.create(subscriptionData);

    console.log(`[SUBSCRIPTION] ✅ Created: ${name} (${category})`);
    console.log(`  startDate: ${start.toDateString()}`);
    console.log(`  nextDueDate: ${nextDueDate.toDateString()}`);
    if (expiryDate) {
      console.log(`  expiryDate: ${new Date(expiryDate).toDateString()}`);
    }

    res.status(201).json({
      success: true,
      message: `${category} created successfully`,
      subscription: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update subscription
 */
exports.updateSubscription = async (req, res, next) => {
  try {
    const { Subscription } = global;
    const { id } = req.params;
    const updates = req.body;

    // Find subscription
    const subscription = await Subscription.findOne({
      _id: id,
      userId: req.userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update allowed fields (exclude nextDueDate - it's auto-calculated)
    const allowedFields = [
      'name',
      'description',
      'category',
      'amount',
      'cycle',
      'startDate',
      'expiryDate',
      'remindBefore',
      'whatsappPhone',
      'paymentMethod',
      'notes',
      'isActive',
      // INSURANCE FIELDS
      'provider',
      'policyNumber',
      'coverageAmount',
      'renewalType',
      // INTERNET FIELDS
      'planName',
      'speedMbps'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        subscription[field] = updates[field];
      }
    });

    // If startDate, cycle, or expiryDate changed, recalculate nextDueDate
    if (updates.startDate || updates.cycle || updates.expiryDate) {
      const start = new Date(subscription.startDate);
      let nextDueDate;

      // Insurance: nextDueDate = expiryDate
      if (subscription.category === 'Insurance') {
        if (subscription.expiryDate) {
          nextDueDate = new Date(subscription.expiryDate);
        } else {
          nextDueDate = addMonthsSafe(start, 12);
        }
      }
      // Internet: Always monthly
      else if (subscription.category === 'Internet') {
        nextDueDate = addMonthsSafe(start, 1);
      }
      // Other categories: Based on cycle
      else {
        nextDueDate = calculateNextDueDate(start, subscription.cycle || 'monthly');
      }

      subscription.nextDueDate = nextDueDate;
      console.log(`[SUBSCRIPTION] Updated nextDueDate: ${subscription.category} → ${nextDueDate.toDateString()}`);
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pay bill for any category
 * POST /bill/pay/:id
 * 
 * Handles:
 * - Internet: Updates lastPaidDate, nextDueDate += 1 month
 * - Insurance: Updates lastPaidDate, nextDueDate += 12 months (yearly renewal)
 * - Loan: Delegates to payEMI
 * - Subscription: Updates lastPaidDate, nextDueDate += 1 cycle
 */
exports.payBill = async (req, res, next) => {
  try {
    const { Subscription } = global;
    const { id } = req.params;
    const { amountPaid = null } = req.body;

    // Find bill
    const bill = await Subscription.findOne({
      _id: id,
      userId: req.userId
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Loan payments handled separately
    if (bill.category === 'Loan') {
      return exports.payEMI(req, res, next);
    }

    // Record payment
    const paymentAmount = bill.amount;
    bill.lastPaidDate = new Date();
    bill.paymentHistory.push({ amount: paymentAmount, paidAt: new Date() });

    // Calculate next due date based on category
    let nextDate = new Date(bill.nextDueDate);

    if (bill.category === 'Internet') {
      nextDate = addMonthsSafe(nextDate, 1);
      console.log(`[INTERNET] Payment recorded: ${bill.name}`);
      console.log(`  Amount: ₹${paymentAmount}`);
      console.log(`  Next Due: ${nextDate.toDateString()}`);
    } else if (bill.category === 'Insurance') {
      nextDate = getInsuranceRenewalDate(nextDate);
      console.log(`[INSURANCE] Payment recorded: ${bill.name}`);
      console.log(`  Premium: ₹${paymentAmount}`);
      console.log(`  Next Renewal: ${nextDate.toDateString()}`);
    } else {
      nextDate = calculateNextDueDate(nextDate, bill.cycle || 'monthly');
      console.log(`[${bill.category.toUpperCase()}] Payment recorded: ${bill.name}`);
      console.log(`  Amount: ₹${paymentAmount}`);
      console.log(`  Next Due: ${nextDate.toDateString()}`);
    }

    bill.nextDueDate = nextDate;
    await bill.save();

    // Re-fetch to get the clean saved document
    const savedBill = await Subscription.findById(bill._id);

    res.status(200).json({
      success: true,
      message: `${bill.category} payment recorded successfully`,
      data: savedBill
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark subscription as paid (standard subscriptions only)
 */
exports.markAsPaid = async (req, res, next) => {
  try {
    const { Subscription } = global;
    const { id } = req.params;

    // Find subscription
    const subscription = await Subscription.findOne({
      _id: id,
      userId: req.userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update last paid date
    subscription.lastPaidDate = new Date();

    // Calculate next due date based on billing cycle
    let nextDate = new Date(subscription.nextDueDate);

    nextDate = calculateNextDueDate(nextDate, subscription.cycle || 'monthly');

    subscription.nextDueDate = nextDate;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription marked as paid',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pay EMI for a loan
 * POST /loan/pay/:id
 */
exports.payEMI = async (req, res, next) => {
  try {
    const { Subscription } = global;
    const { id } = req.params;
    const { amountPaid = null } = req.body;

    // Find loan subscription
    const loan = await Subscription.findOne({
      _id: id,
      userId: req.userId,
      category: 'Loan'
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Use EMI amount or custom amount
    const paymentAmount = amountPaid ? Number(amountPaid) : loan.emiAmount;

    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    // Update remaining amount
    const newRemaining = Math.max(0, loan.remainingAmount - paymentAmount);
    loan.remainingAmount = newRemaining;
    loan.lastPaidDate = new Date();
    loan.paidCount = (loan.paidCount || 0) + 1;
    loan.paymentHistory.push({ amount: paymentAmount, paidAt: new Date() });

    // Calculate next due date
    loan.nextDueDate = addMonthsSafe(loan.nextDueDate, 1);

    // Check if loan is fully paid
    if (newRemaining <= 0) {
      loan.status = 'Completed';
      console.log(`[LOAN] ✅ Fully Paid: ${loan.name}`);
      console.log(`  Total Payments: ${loan.paidCount}`);
      console.log(`  Total Paid: ₹${loan.totalAmount}`);
    }

    await loan.save();

    const savedLoan = await Subscription.findById(loan._id);
    const progress = calculatePaymentProgress(savedLoan.totalAmount, savedLoan.remainingAmount);

    console.log(`[LOAN] Payment Recorded: ${savedLoan.name}`);
    console.log(`  Amount: ₹${paymentAmount}`);
    console.log(`  Remaining: ₹${savedLoan.remainingAmount}`);
    console.log(`  Progress: ${progress}%`);

    res.status(200).json({
      success: true,
      message: 'EMI payment recorded successfully',
      data: {
        ...savedLoan.toObject(),
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get loan statistics for dashboard
 */
exports.getLoanStats = async (req, res, next) => {
  try {
    const { Subscription } = global;

    // Get all active loans
    const loans = await Subscription.find({
      userId: req.userId,
      category: 'Loan',
      isActive: true
    });

    // Calculate stats
    const activeLoanCount = loans.filter(l => l.status === 'Active').length;
    const totalOutstanding = loans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);
    
    // Get next EMI due
    const nextEMI = loans
      .filter(l => l.status === 'Active')
      .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0];

    const completedLoansCount = loans.filter(l => l.status === 'Completed').length;
    const totalPaid = loans.reduce((sum, l) => {
      if (l.status === 'Completed') {
        return sum + (l.totalAmount || 0);
      }
      const paid = (l.totalAmount || 0) - (l.remainingAmount || 0);
      return sum + paid;
    }, 0);

    res.status(200).json({
      success: true,
      stats: {
        activeLoanCount,
        completedLoansCount,
        totalOutstanding,
        totalPaid,
        nextEMI: nextEMI ? {
          name: nextEMI.name,
          amount: nextEMI.emiAmount,
          dueDate: nextEMI.nextDueDate,
          remaining: nextEMI.remainingAmount
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete subscription
 */
exports.deleteSubscription = async (req, res, next) => {
  try {
    const { Subscription } = global;
    const { id } = req.params;

    // Find and delete subscription
    const subscription = await Subscription.findOneAndDelete({
      _id: id,
      userId: req.userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get aggregated payment history across all subscriptions
 * GET /subscriptions/payments/history
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { Subscription } = global;

    const subscriptions = await Subscription.find(
      { userId: req.userId, 'paymentHistory.0': { $exists: true } },
      { name: 1, category: 1, cycle: 1, emiAmount: 1, amount: 1, paymentHistory: 1 }
    );

    // Flatten all paymentHistory entries across all subscriptions
    const payments = [];
    for (const sub of subscriptions) {
      for (const p of sub.paymentHistory) {
        payments.push({
          subscriptionId: sub._id,
          name: sub.name,
          category: sub.category,
          cycle: sub.cycle,
          amount: p.amount,
          paidAt: p.paidAt,
          note: p.note || ''
        });
      }
    }

    // Sort by most recent first
    payments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      payments,
      count: payments.length,
      totalPaid
    });
  } catch (error) {
    next(error);
  }
};
