'use strict';

const Joi = require('joi');

const passwordSchema = Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Password must be 8–128 characters and contain at least one uppercase letter, one lowercase letter, and one number.');

const register = {
    body: Joi.object({
        fullName: Joi.string().trim().min(3).max(100).required()
            .messages({ 'string.min': 'Full name must be at least 3 characters.' }),
        email: Joi.string().trim().email().lowercase().max(255).required(),
        password: passwordSchema.required(),
        role: Joi.string().valid('ADMIN', 'STORE').required()
            .messages({ 'any.only': 'Role must be ADMIN or STORE.' }),
    }),
};

const login = {
    body: Joi.object({
        email: Joi.string().trim().email().lowercase().required(),
        password: Joi.string().required(),
    }),
};

const refreshToken = {
    body: Joi.object({
        refreshToken: Joi.string().required(),
    }),
};

const forgotPassword = {
    body: Joi.object({
        email: Joi.string().trim().email().lowercase().required(),
    }),
};

const resetPassword = {
    body: Joi.object({
        token: Joi.string().required(),
        password: passwordSchema.required(),
    }),
};

const changePassword = {
    body: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: passwordSchema.required(),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
            .messages({ 'any.only': 'Passwords do not match.' }),
    }),
};

const updateProfile = {
    body: Joi.object({
        fullName: Joi.string().trim().min(3).max(100),
    }),
};

module.exports = { register, login, refreshToken, forgotPassword, resetPassword, changePassword, updateProfile };
