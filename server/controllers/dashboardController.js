/**
 * Dashboard Controller
 * Handles dashboard analytics and statistics
 * Includes loan metrics for financial reminders
 */

const { calculatePaymentProgress } = require('../utils/dateUtils');

/**
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { Subscription } = global;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get ALL active subscriptions with required fields
    const allSubscriptions = await Subscription.find({
      userId: req.userId,
      isActive: true
    }).select('name amount status nextDueDate category isActive totalAmount remainingAmount emiAmount tenureMonths');

    console.log(`[DASHBOARD] Found ${allSubscriptions.length} active subscriptions for user ${req.userId}`);
    
    // Calculate stats from subscriptions
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);

    // Separate by category
    const subscriptions = allSubscriptions.filter(s => s.category !== 'Loan');
    const loans = allSubscriptions.filter(s => s.category === 'Loan');

    // Monthly total (sum all active subscription amounts, not loans)
    const monthlyTotal = subscriptions.reduce((sum, sub) => {
      return sum + (Number(sub.amount) || 0);
    }, 0);

    // Due Soon (next 7 days)
    const dueSoonCount = allSubscriptions.filter(s => {
      const d = new Date(s.nextDueDate);
      return d >= now && d <= in7Days;
    }).length;

    // Overdue (before today)
    const overdueCount = allSubscriptions.filter(s => {
      const d = new Date(s.nextDueDate);
      return d < now;
    }).length;

    // ============================================================
    // LOAN METRICS
    // ============================================================
    const activeLoanCount = loans.filter(l => l.status === 'Active').length;
    const completedLoansCount = loans.filter(l => l.status === 'Completed').length;
    const totalOutstanding = loans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);
    
    // Calculate total EMI for active loans
    const totalMonthlyEMI = loans
      .filter(l => l.status === 'Active')
      .reduce((sum, l) => sum + (l.emiAmount || 0), 0);

    // Get next EMI due
    const nextEMI = loans
      .filter(l => l.status === 'Active')
      .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0];

    console.log(`[DASHBOARD] Stats - Subscriptions: ${subscriptions.length}, Loans: ${loans.length}`);
    console.log(`[DASHBOARD] Monthly: ₹${monthlyTotal}, EMI: ₹${totalMonthlyEMI}, Outstanding: ₹${totalOutstanding}`);

    res.status(200).json({
      success: true,
      subscriptions: allSubscriptions,
      stats: {
        // Subscription stats
        totalSubscriptions: subscriptions.length,
        monthlyTotal: parseFloat(monthlyTotal.toFixed(2)),
        upcomingBillsCount: dueSoonCount,
        overdueBillsCount: overdueCount,
        
        // Loan stats
        activeLoanCount,
        completedLoansCount,
        totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
        totalMonthlyEMI: parseFloat(totalMonthlyEMI.toFixed(2)),
        nextEMI: nextEMI ? {
          name: nextEMI.name,
          amount: nextEMI.emiAmount,
          dueDate: nextEMI.nextDueDate,
          remaining: nextEMI.remainingAmount
        } : null
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
    const allSubscriptions = await Subscription.find({
      userId: req.userId,
      isActive: true
    });

    // Group by category and calculate totals
    const categoryMap = {};
    allSubscriptions.forEach(sub => {
      const category = sub.category || 'Uncategorized';
      
      let categoryAmount = 0;
      if (category === 'Loan') {
        // For loans, show EMI amount
        categoryAmount = sub.emiAmount || 0;
      } else {
        // For subscriptions, show regular amount
        categoryAmount = sub.amount || 0;
      }

      if (!categoryMap[category]) {
        categoryMap[category] = {
          category,
          count: 0,
          total: 0
        };
      }

      categoryMap[category].count += 1;
      categoryMap[category].total += categoryAmount;
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

/**
 * Get detailed loan information for dashboard
 */
exports.getLoanDetails = async (req, res, next) => {
  try {
    const { Subscription } = global;

    const loans = await Subscription.find({
      userId: req.userId,
      category: 'Loan',
      isActive: true
    }).sort({ nextDueDate: 1 });

    const loanDetails = loans.map(loan => ({
      _id: loan._id,
      name: loan.name,
      totalAmount: loan.totalAmount,
      emiAmount: loan.emiAmount,
      remainingAmount: loan.remainingAmount,
      paidCount: loan.paidCount || 0,
      tenureMonths: loan.tenureMonths,
      nextDueDate: loan.nextDueDate,
      endDate: loan.endDate,
      status: loan.status,
      progress: calculatePaymentProgress(loan.totalAmount, loan.remainingAmount)
    }));

    res.status(200).json({
      success: true,
      loans: loanDetails
    });
  } catch (error) {
    console.error('Loan details error:', error);
    next(error);
  }
};
