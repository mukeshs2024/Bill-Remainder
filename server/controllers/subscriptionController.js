const { sendReminderEmail } = require('../utils/emailService');

/**
 * Subscription Controller
 * Handles all subscription-related operations
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
 */
exports.createSubscription = async (req, res, next) => {
  try {
    const { Subscription, User } = global;
    const {
      serviceName,
      description,
      category,
      amount,
      billingCycle,
      billingCycleDays,
      startDate,
      endDate,
      reminderDaysBefore,
      paymentMethod,
      notes
    } = req.body;

    // Validation
    if (!serviceName || !amount || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Service name, amount, start date, and end date are required'
      });
    }

    // Get user email
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create subscription
    const subscription = await Subscription.create({
      userId: req.userId,
      serviceName,
      description: description || '',
      category: category || 'other',
      amount,
      billingCycle: billingCycle || 'monthly',
      billingCycleDays: billingCycleDays || 30,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      nextDueDate: new Date(startDate),
      email: user.email,
      reminderDaysBefore: reminderDaysBefore || 3,
      paymentMethod: paymentMethod || '',
      notes: notes || '',
      isActive: true,
      lastNotified: null
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
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

    // Update allowed fields
    const allowedFields = [
      'serviceName',
      'description',
      'category',
      'amount',
      'billingCycle',
      'billingCycleDays',
      'startDate',
      'endDate',
      'nextDueDate',
      'reminderDaysBefore',
      'paymentMethod',
      'notes',
      'isActive'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        subscription[field] = updates[field];
      }
    });

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
 * Mark subscription as paid
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

    if (subscription.billingCycle === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (subscription.billingCycle === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else if (subscription.billingCycle === 'custom' && subscription.billingCycleDays) {
      nextDate.setDate(nextDate.getDate() + subscription.billingCycleDays);
    }

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
