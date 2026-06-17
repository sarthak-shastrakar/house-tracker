const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getOverview,
  getBudgetOverview,
  getMaterialBreakdown,
  getContractorSummary,
  getMonthlySpending,
  getBudgetAlerts,
} = require('../controllers/analytics.controller');

router.use(protect);

router.get('/overview', getOverview);
router.get('/budget-overview', getBudgetOverview);
router.get('/material-breakdown', getMaterialBreakdown);
router.get('/contractor-summary', getContractorSummary);
router.get('/monthly-spending', getMonthlySpending);
router.get('/budget-alerts', getBudgetAlerts);

module.exports = router;
