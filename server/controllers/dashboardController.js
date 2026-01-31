/**
 * Dashboard Controller
 * Handles dashboard analytics and statistics
 */

/**
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { Subscription } = global;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get all active subscriptions count
    const totalSubscriptions = await Subscription.countDocuments({
      userId: req.userId,
      isActive: true
    });

    // Get upcoming bills (next 7 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7);

    const upcomingBills = await Subscription.find({
      userId: req.userId,
      isActive: true,
      nextDueDate: {
        $gte: today,
        $lte: upcomingDate
      }
    });

    // Get overdue bills
    const overdueBills = await Subscription.find({
      userId: req.userId,
      isActive: true,
      nextDueDate: { $lt: today }
    });

    // Calculate monthly total
    const monthlyBills = await Subscription.find({
      userId: req.userId,
      isActive: true,
      nextDueDate: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth
      }
    });

    const monthlyTotal = monthlyBills.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);

    // Get all subscriptions for average calculation
    const allSubscriptions = await Subscription.find({
      userId: req.userId,
      isActive: true
    });

    // Calculate total monthly expense
    let totalMonthlyExpense = 0;
    allSubscriptions.forEach(sub => {
      const amount = parseFloat(sub.amount || 0);
      if (sub.billingCycle === 'monthly') {
        totalMonthlyExpense += amount;
      } else if (sub.billingCycle === 'yearly') {
        totalMonthlyExpense += amount / 12;
      } else if (sub.billingCycle === 'custom' && sub.billingCycleDays) {
        totalMonthlyExpense += (amount * 30) / sub.billingCycleDays;
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalSubscriptions,
        monthlyTotal: parseFloat(monthlyTotal.toFixed(2)),
        upcomingBillsCount: upcomingBills.length,
        overdueBillsCount: overdueBills.length,
        averageMonthlyExpense: parseFloat(totalMonthlyExpense.toFixed(2)),
        upcomingBills: upcomingBills.map(b => ({
          id: b._id,
          serviceName: b.serviceName,
          amount: b.amount,
          nextDueDate: b.nextDueDate
        })),
        overdueBills: overdueBills.map(b => ({
          id: b._id,
          serviceName: b.serviceName,
          amount: b.amount,
          nextDueDate: b.nextDueDate
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    next(error);
  }
};

/**
 * Get spending breakdown by category
 */
exports.getSpendingByCategory = async (req, res, next) => {
  try {
    const { Subscription } = global;

    // Get all active subscriptions
    const allSubscriptions = await Subscription.findAll({
      where: {
        userId: req.userId,
        isActive: true
      }
    });

    // Group by category and calculate totals
    const categoryMap = {};
    allSubscriptions.forEach(sub => {
      const category = sub.category || 'Uncategorized';
      const amount = parseFloat(sub.amount || 0);

      if (!categoryMap[category]) {
        categoryMap[category] = {
          category,
          count: 0,
          total: 0
        };
      }

      categoryMap[category].count += 1;
      categoryMap[category].total += amount;
    });

    const categoryData = Object.values(categoryMap).sort((a, b) => b.total - a.total);

    res.status(200).json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    console.error('Category breakdown error:', error);
    next(error);
  }
};
