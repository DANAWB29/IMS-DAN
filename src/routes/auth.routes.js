'use strict';

const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const v = require('../validators/auth.validator');

// ── Public routes (rate-limited) ─────────────────────────────
router.post('/register', authLimiter, validate(v.register), authController.register);
router.post('/login', authLimiter, validate(v.login), authController.login);
router.post('/refresh', validate(v.refreshToken), authController.refresh);
router.post('/forgot-password', authLimiter, validate(v.forgotPassword), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetPassword), authController.resetPassword);

// ── Protected routes ─────────────────────────────────────────
router.use(authenticate);

router.post('/logout', authController.logout);
router.get('/me', authController.me);
router.patch('/me', validate(v.updateProfile), authController.updateProfile);
router.patch('/change-password', validate(v.changePassword), authController.changePassword);

module.exports = router;
