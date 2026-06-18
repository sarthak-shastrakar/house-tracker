const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

// Apply protection middleware to all dashboard endpoints
router.use(protect);

router.get('/stats', dashboardController.getStats);
router.get('/budget-overview', dashboardController.getBudgetOverview);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/deleted-items', dashboardController.getDeletedItems);

module.exports = router;


