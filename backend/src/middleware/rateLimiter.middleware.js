'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// Skip rate limiting for localhost in dev (allows testing without hitting limits)
const isLocalDev = (req) =>
    env.NODE_ENV === 'test' ||
    (env.isDev && ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(req.ip));

/**
 * General API rate limiter — applies to all routes
 */
const apiLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this IP. Please try again later.' },
    skip: isLocalDev,
});

/**
 * Strict limiter for auth routes (login, forgot password)
 * Prevents brute-force attacks — enforced in production only
 */
const authLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
    skip: isLocalDev,
});

module.exports = { apiLimiter, authLimiter };
