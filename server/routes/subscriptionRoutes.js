const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authenticateToken = require('../middleware/authenticate');

/**
 * Subscription Routes
 * All routes are protected and require authentication
 */

// ============================================================
// STANDARD SUBSCRIPTIONS
// ============================================================

// Get all subscriptions
router.get('/', authenticateToken, subscriptionController.getAllSubscriptions);

// Get upcoming subscriptions (next 7 days by default)
router.get('/upcoming', authenticateToken, subscriptionController.getUpcomingSubscriptions);

// Get overdue subscriptions
router.get('/overdue', authenticateToken, subscriptionController.getOverdueSubscriptions);

// Get subscription by ID
router.get('/:id', authenticateToken, subscriptionController.getSubscriptionById);

// Create new subscription/loan
router.post('/', authenticateToken, subscriptionController.createSubscription);

// Update subscription
router.put('/:id', authenticateToken, subscriptionController.updateSubscription);

// Mark subscription as paid
router.put('/:id/mark-paid', authenticateToken, subscriptionController.markAsPaid);

// Pay bill (handles all categories: Internet, Insurance, Subscription)
router.post('/:id/pay', authenticateToken, subscriptionController.payBill);

// Delete subscription
router.delete('/:id', authenticateToken, subscriptionController.deleteSubscription);

// ============================================================
// LOAN-SPECIFIC ENDPOINTS
// ============================================================

// Pay EMI for a loan
router.post('/:id/pay-emi', authenticateToken, subscriptionController.payEMI);

// Get loan statistics for dashboard
router.get('/loans/stats', authenticateToken, subscriptionController.getLoanStats);

// Get aggregated payment history across all subscriptions
router.get('/payments/history', authenticateToken, subscriptionController.getPaymentHistory);

module.exports = router;
