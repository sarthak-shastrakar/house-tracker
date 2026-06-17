const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createContractor,
  getContractors,
  getContractorById,
  updateContractor,
  deleteContractor,
  recordPayment,
  deletePayment,
  getContractorSummary,
} = require('../controllers/contractor.controller');

// Apply auth middleware to all routes
router.use(protect);

// Contractor CRUD
router.get('/', getContractors);
router.post('/', createContractor);
router.get('/summary/:projectId', getContractorSummary);
router.get('/:id', getContractorById);
router.put('/:id', updateContractor);
router.delete('/:id', deleteContractor);

// Payment sub-routes
router.post('/:id/payments', recordPayment);
router.delete('/:contractorId/payments/:paymentId', deletePayment);

module.exports = router;
