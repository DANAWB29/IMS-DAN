'use strict';

const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Global error handler middleware.
 * Must have 4 parameters for Express to treat it as an error handler.
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
    // Log all errors
    logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
        stack: err.stack,
        userId: req.user?.id || 'unauthenticated',
        ip: req.ip,
    });

    // Handle Prisma known errors
    if (err.code === 'P2002') {
        const field = err.meta?.target?.join(', ') || 'field';
        return res.status(409).json({
            success: false,
            message: `A record with this ${field} already exists.`,
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            success: false,
            message: 'Record not found.',
        });
    }

    if (err.code === 'P2003') {
        return res.status(400).json({
            success: false,
            message: 'Related record does not exist.',
        });
    }

    // Handle Joi validation errors (in case they bubble up)
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed.',
            errors: err.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/"/g, '') })),
        });
    }

    // Handle our operational AppErrors
    if (err instanceof AppError && err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.errors && { errors: err.errors }),
        });
    }

    // Programming / unexpected errors — don't leak details in production
    const statusCode = err.statusCode || 500;
    const message = env.isProd ? 'Internal Server Error' : err.message;

    return res.status(statusCode).json({
        success: false,
        message,
        ...(env.isDev && { stack: err.stack }),
    });
};

module.exports = errorHandler;
