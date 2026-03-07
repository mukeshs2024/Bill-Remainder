/**
 * Safe Date Utilities
 * Handles month arithmetic without day overflow
 * Example: Jan 31 + 1 month = Feb 28 (not Mar 3)
 */

/**
 * Add months to a date safely, handling day overflow
 * @param {Date} date - Base date
 * @param {number} months - Number of months to add
 * @returns {Date} - New date with safe month addition
 */
function addMonthsSafe(date, months) {
  const d = new Date(date);
  const originalDay = d.getDate();
  
  // Set to 1st to avoid overflow issues
  d.setDate(1);
  
  // Add the months
  d.setMonth(d.getMonth() + months);
  
  // Get the last day of the target month
  const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  
  // Set the day (min of original day or last day of month)
  d.setDate(Math.min(originalDay, lastDayOfMonth));
  
  return d;
}

/**
 * Calculate loan end date
 * @param {Date} startDate - Loan start date
 * @param {number} tenureMonths - Loan tenure in months
 * @returns {Date} - Auto-calculated end date
 */
function calculateLoanEndDate(startDate, tenureMonths) {
  return addMonthsSafe(startDate, tenureMonths);
}

/**
 * Calculate amortization schedule
 * @param {number} totalAmount - Total loan amount
 * @param {number} emiAmount - Monthly EMI
 * @param {Date} startDate - Start date
 * @returns {Array} - Array of payment schedules
 */
function generateAmortizationSchedule(totalAmount, emiAmount, startDate) {
  const schedule = [];
  let remaining = totalAmount;
  let currentDate = new Date(startDate);
  let paymentNumber = 1;
  
  while (remaining > 0) {
    const emiPaid = Math.min(emiAmount, remaining);
    remaining -= emiPaid;
    
    schedule.push({
      paymentNumber,
      dueDate: new Date(currentDate),
      emiAmount: emiPaid,
      remainingAfter: Math.max(0, remaining)
    });
    
    // Move to next month
    currentDate = addMonthsSafe(currentDate, 1);
    paymentNumber++;
  }
  
  return schedule;
}

/**
 * Calculate payment progress
 * @param {number} totalAmount - Total loan amount
 * @param {number} remainingAmount - Outstanding balance
 * @returns {number} - Percentage paid (0-100)
 */
function calculatePaymentProgress(totalAmount, remainingAmount) {
  if (totalAmount <= 0) return 0;
  const paid = totalAmount - remainingAmount;
  return Math.round((paid / totalAmount) * 100);
}

/**
 * Calculate next due date for insurance renewal
 * @param {Date} expiryDate - Insurance expiry date
 * @returns {Date} - Same as expiryDate (renewal due on expiry)
 */
function getInsuranceNextDueDate(expiryDate) {
  return new Date(expiryDate);
}

/**
 * Calculate next due date after insurance renewal
 * @param {Date} currentNextDueDate - Current nextDueDate
 * @returns {Date} - Adds 12 months to currentNextDueDate
 */
function getInsuranceRenewalDate(currentNextDueDate) {
  return addMonthsSafe(currentNextDueDate, 12);
}

/**
 * Check if a loan is fully paid
 * @param {number} remainingAmount - Outstanding loan balance
 * @returns {boolean}
 */
function isLoanPaid(remainingAmount) {
  return remainingAmount <= 0;
}

/**
 * Check if insurance is overdue
 * @param {Date} expiryDate - Insurance expiry date
 * @returns {boolean}
 */
function isInsuranceOverdue(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return expiry < today;
}

/**
 * Check if insurance renewal is due soon
 * @param {Date} expiryDate - Insurance expiry date
 * @param {number} daysThreshold - Number of days to check
 * @returns {boolean}
 */
function isInsuranceRenewalDue(expiryDate, daysThreshold = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= daysThreshold && daysUntilExpiry >= 0;
}

/**
 * Calculate the next due date based on billing cycle
 * @param {Date} date - Base date (startDate on create, current nextDueDate on pay)
 * @param {string} cycle - 'weekly' | 'monthly' | 'quarterly' | 'yearly'
 * @returns {Date}
 */
function calculateNextDueDate(date, cycle) {
  const d = new Date(date);
  switch (cycle) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      return d;
    case 'quarterly':
      return addMonthsSafe(d, 3);
    case 'yearly':
      return addMonthsSafe(d, 12);
    case 'monthly':
    default:
      return addMonthsSafe(d, 1);
  }
}

module.exports = {
  addMonthsSafe,
  calculateLoanEndDate,
  calculateNextDueDate,
  generateAmortizationSchedule,
  calculatePaymentProgress,
  isLoanPaid,
  getInsuranceNextDueDate,
  getInsuranceRenewalDate,
  isInsuranceOverdue,
  isInsuranceRenewalDue
};
