'use strict';

const AppError = require('../utils/AppError');
const { HTTP } = require('../constants');

/**
 * Middleware factory for Joi schema validation.
 * Compatible with Express v5 (req.query is read-only in v5).
 * @param {object} schema - Joi schema with optional keys: body, params, query
 */
const validate = (schema) => {
    return (req, res, next) => {
        const errors = [];

        if (schema.body) {
            const { error, value } = schema.body.validate(req.body, { abortEarly: false, stripUnknown: true });
            if (error) {
                errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/"/g, '') })));
            } else {
                req.body = value;
            }
        }

        if (schema.params) {
            const { error } = schema.params.validate(req.params, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/"/g, '') })));
            }
        }

        if (schema.query) {
            const { error, value } = schema.query.validate(req.query, { abortEarly: false, stripUnknown: true });
            if (error) {
                errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/"/g, '') })));
            } else {
                // Express v5: req.query is a read-only getter — copy each validated key individually
                if (value && typeof value === 'object') {
                    Object.keys(value).forEach((k) => {
                        req.query[k] = value[k];
                    });
                }
            }
        }

        if (errors.length > 0) {
            return next(new AppError('Validation failed.', HTTP.BAD_REQUEST, errors));
        }

        next();
    };
};

module.exports = validate;
