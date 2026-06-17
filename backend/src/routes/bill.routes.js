const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');
const {
  uploadBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
  getBillSummary,
} = require('../controllers/bill.controller');

// Apply auth to all routes
router.use(protect);

// ─── Routes ───────────────────────────────────────────────────────────────────
router.get('/', getBills);

// summary MUST come before /:id to avoid conflict
router.get('/summary/:projectId', getBillSummary);

// Upload: multer parses multipart/form-data before controller
router.post('/upload', upload.single('file'), uploadBill);

router.get('/:id', getBillById);
router.put('/:id', updateBill);
router.delete('/:id', deleteBill);

module.exports = router;
