'use strict';

/**
 * Parse and sanitize pagination query params
 * @param {object} query - Express req.query
 * @returns {{ page, limit, skip, sortBy, sortOrder }}
 */
const parsePagination = (query, allowedSortFields = []) => {
    let page = parseInt(query.page, 10) || 1;
    let limit = parseInt(query.limit, 10) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100; // Max 100 per page for safety

    const skip = (page - 1) * limit;

    let sortBy = query.sortBy || 'createdAt';
    let sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    // Whitelist sort fields to prevent injection
    if (allowedSortFields.length > 0 && !allowedSortFields.includes(sortBy)) {
        sortBy = 'createdAt';
    }

    return { page, limit, skip, sortBy, sortOrder };
};

module.exports = { parsePagination };
