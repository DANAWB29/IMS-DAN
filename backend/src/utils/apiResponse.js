'use strict';

/**
 * Send a successful response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Response data payload
 * @param {number} status - HTTP status code (default 200)
 * @param {object} meta - Pagination or extra metadata
 */
const success = (res, message, data = null, status = 200, meta = null) => {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    if (meta !== null) response.meta = meta;
    return res.status(status).json(response);
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code (default 500)
 * @param {object|null} errors - Validation errors array or details
 */
const error = (res, message, status = 500, errors = null) => {
    const response = { success: false, message };
    if (errors !== null) response.errors = errors;
    return res.status(status).json(response);
};

/**
 * Build a paginated meta object
 */
const paginate = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
});

module.exports = { success, error, paginate };
