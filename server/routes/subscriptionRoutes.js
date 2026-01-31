const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authenticateToken = require('../middleware/authenticate');

/**
 * Subscription Routes
 * All routes are protected and require authentication
 */

// Get all subscriptions
router.get('/', authenticateToken, subscriptionController.getAllSubscriptions);

// Get upcoming subscriptions (next 7 days by default)
router.get('/upcoming', authenticateToken, subscriptionController.getUpcomingSubscriptions);

// Get overdue subscriptions
router.get('/overdue', authenticateToken, subscriptionController.getOverdueSubscriptions);

// Get subscription by ID
router.get('/:id', authenticateToken, subscriptionController.getSubscriptionById);

// Create new subscription
router.post('/', authenticateToken, subscriptionController.createSubscription);

// Update subscription
router.put('/:id', authenticateToken, subscriptionController.updateSubscription);

// Mark subscription as paid
router.put('/:id/mark-paid', authenticateToken, subscriptionController.markAsPaid);

// Delete subscription
router.delete('/:id', authenticateToken, subscriptionController.deleteSubscription);

module.exports = router;
