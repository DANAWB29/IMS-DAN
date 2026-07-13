'use strict';

class AppError extends Error {
    /**
     * @param {string} message - Human-readable error message
     * @param {number} statusCode - HTTP status code
     * @param {object|null} errors - Validation errors or additional details
     */
    constructor(message, statusCode = 500, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Distinguish from programming errors
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
