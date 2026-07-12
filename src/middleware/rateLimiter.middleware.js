'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * General API rate limiter — applies to all routes
 */
const apiLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again later.',
    },
    skip: () => env.NODE_ENV === 'test',
});

/**
 * Strict limiter for auth routes (login, forgot password)
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
    skip: () => env.NODE_ENV === 'test',
});

module.exports = { apiLimiter, authLimiter };
