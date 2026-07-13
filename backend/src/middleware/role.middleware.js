'use strict';

const AppError = require('../utils/AppError');
const { HTTP } = require('../constants');

/**
 * Authorize request based on user role.
 * Must be used AFTER the authenticate middleware.
 * @param {...string} roles - Allowed roles, e.g. authorize('ADMIN') or authorize('ADMIN','STORE')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required.', HTTP.UNAUTHORIZED));
        }

        if (!roles.includes(req.user.role.name)) {
            return next(
                new AppError(
                    `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role.name}.`,
                    HTTP.FORBIDDEN
                )
            );
        }

        next();
    };
};

module.exports = authorize;
