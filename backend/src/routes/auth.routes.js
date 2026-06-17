const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  getMe,
  logout,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// ─── Register ─────────────────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Enter a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

// ─── Login ────────────────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Enter a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  login
);

// ─── Refresh Token ────────────────────────────────────────────────────────────
router.post('/refresh-token', refreshToken);

// ─── Get Me (Protected) ───────────────────────────────────────────────────────
router.get('/me', protect, getMe);

// ─── Logout (Protected) ───────────────────────────────────────────────────────
router.post('/logout', protect, logout);

module.exports = router;
