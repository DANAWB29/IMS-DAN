'use strict';

const authService = require('../services/auth.service');
const { success } = require('../utils/apiResponse');
const { HTTP } = require('../constants');

// ─── Register ────────────────────────────────────────────────

const register = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const result = await authService.register(req.body, ipAddress, userAgent);
        return success(res, 'Account created successfully.', result, HTTP.CREATED);
    } catch (err) {
        next(err);
    }
};

// ─── Login ───────────────────────────────────────────────────

const login = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const result = await authService.login(req.body, ipAddress, userAgent);
        return success(res, 'Login successful.', result);
    } catch (err) {
        next(err);
    }
};

// ─── Refresh Token ───────────────────────────────────────────

const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const result = await authService.refresh(refreshToken, ipAddress, userAgent);
        return success(res, 'Token refreshed successfully.', result);
    } catch (err) {
        next(err);
    }
};

// ─── Logout ──────────────────────────────────────────────────

const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        await authService.logout(refreshToken, req.user.id);
        return success(res, 'Logged out successfully.');
    } catch (err) {
        next(err);
    }
};

// ─── Forgot Password ─────────────────────────────────────────

const forgotPassword = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        await authService.forgotPassword(req.body.email, ipAddress);
        // Always return success to prevent email enumeration
        return success(res, 'If that email exists, a reset link has been sent.');
    } catch (err) {
        next(err);
    }
};

// ─── Reset Password ──────────────────────────────────────────

const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        await authService.resetPassword(token, password, ipAddress);
        return success(res, 'Password reset successfully. Please log in with your new password.');
    } catch (err) {
        next(err);
    }
};

// ─── Change Password ─────────────────────────────────────────

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        await authService.changePassword(req.user.id, currentPassword, newPassword, ipAddress);
        return success(res, 'Password changed successfully.');
    } catch (err) {
        next(err);
    }
};

// ─── Current User ────────────────────────────────────────────

const me = async (req, res, next) => {
    try {
        const user = await authService.getMe(req.user.id);
        return success(res, 'Current user retrieved.', user);
    } catch (err) {
        next(err);
    }
};

// ─── Update Profile ──────────────────────────────────────────

const updateProfile = async (req, res, next) => {
    try {
        const user = await authService.updateProfile(req.user.id, req.body);
        return success(res, 'Profile updated successfully.', user);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register,
    login,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    me,
    updateProfile,
};
