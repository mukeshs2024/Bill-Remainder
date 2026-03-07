const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/authenticate');

/**
 * Dashboard Routes
 * All routes are protected and require authentication
 */

// Get dashboard statistics and overview
router.get('/stats', authenticateToken, dashboardController.getDashboardStats);

// Get spending by category
router.get('/category-breakdown', authenticateToken, dashboardController.getSpendingByCategory);

// Get detailed loan information
router.get('/loans', authenticateToken, dashboardController.getLoanDetails);

module.exports = router;
