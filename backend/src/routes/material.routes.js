const express = require('express');
const router = express.Router();
const materialController = require('../controllers/material.controller');
const { protect } = require('../middleware/auth.middleware');

// Apply protection to all material routes
router.use(protect);

router
  .route('/')
  .post(materialController.createPurchase)
  .get(materialController.getPurchases);

router
  .route('/:id')
  .get(materialController.getPurchaseById)
  .put(materialController.updatePurchase)
  .delete(materialController.deletePurchase);

router.get('/summary/:projectId', materialController.getSummary);

module.exports = router;
