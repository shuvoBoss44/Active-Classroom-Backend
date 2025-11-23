const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/stats/dashboard
 * @desc    Get dashboard statistics (admin only)
 * @access  Private/Admin
 */
router.get('/dashboard', verifyToken, isAdmin, statsController.getDashboardStats);

/**
 * @route   GET /api/stats/revenue
 * @desc    Get revenue analytics with time period
 * @access  Private/Admin
 */
router.get('/revenue', verifyToken, isAdmin, statsController.getRevenueAnalytics);

/**
 * @route   GET /api/stats/students
 * @desc    Get student growth analytics
 * @access  Private/Admin
 */
router.get('/students', verifyToken, isAdmin, statsController.getStudentGrowth);

module.exports = router;
