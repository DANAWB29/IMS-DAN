'use strict';

const userService = require('../services/user.service');
const { success } = require('../utils/apiResponse');
const { HTTP } = require('../constants');

// ─── List all users ──────────────────────────────────────────

const listUsers = async (req, res, next) => {
    try {
        const result = await userService.listUsers(req.query);
        return success(res, 'Users retrieved successfully.', result.users, HTTP.OK, result.meta);
    } catch (err) {
        next(err);
    }
};

// ─── Get user by ID ──────────────────────────────────────────

const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        return success(res, 'User retrieved successfully.', user);
    } catch (err) {
        next(err);
    }
};

// ─── Update user ─────────────────────────────────────────────

const updateUser = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const user = await userService.updateUser(req.params.id, req.body, req.user.id, ipAddress);
        return success(res, 'User updated successfully.', user);
    } catch (err) {
        next(err);
    }
};

// ─── Delete user ─────────────────────────────────────────────

const deleteUser = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        await userService.deleteUser(req.params.id, req.user.id, ipAddress);
        return success(res, 'User deleted successfully.');
    } catch (err) {
        next(err);
    }
};

// ─── Admin reset password ────────────────────────────────────

const adminResetPassword = async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
        }
        const ipAddress = req.ip || req.connection.remoteAddress;
        await userService.adminResetPassword(req.params.id, newPassword, req.user.id, ipAddress);
        return success(res, 'User password reset successfully.');
    } catch (err) {
        next(err);
    }
};

// ─── Get all roles ────────────────────────────────────────────

const getRoles = async (req, res, next) => {
    try {
        const roles = await userService.getRoles();
        return success(res, 'Roles retrieved successfully.', roles);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    listUsers,
    getUserById,
    updateUser,
    deleteUser,
    adminResetPassword,
    getRoles,
};
