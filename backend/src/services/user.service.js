'use strict';

const bcrypt = require('bcrypt');
const repo = require('../repositories/user.repository');
const { logActivity } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { paginate } = require('../utils/apiResponse');

const SALT_ROUNDS = 12;

// ─── List all users (admin only) ────────────────────────────

const listUsers = async (query) => {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, [
        'fullName', 'email', 'createdAt', 'lastLogin',
    ]);

    const where = {};

    if (query.search) {
        where.OR = [
            { fullName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
        ];
    }

    if (query.role) {
        where.role = { name: query.role };
    }

    if (query.isActive !== undefined) {
        where.isActive = query.isActive === 'true' || query.isActive === true;
    }

    const [users, total] = await Promise.all([
        repo.findAll({ skip, take: limit, where, orderBy: { [sortBy]: sortOrder } }),
        repo.count(where),
    ]);

    // Strip passwords
    const safeUsers = users.map(({ password: _, ...u }) => u);

    return {
        users: safeUsers,
        meta: paginate(total, page, limit),
    };
};

// ─── Get single user ────────────────────────────────────────

const getUserById = async (id) => {
    const user = await repo.findById(id);
    if (!user) throw new AppError('User not found.', 404);
    const { password: _, ...safe } = user;
    return safe;
};

// ─── Update user (admin) ────────────────────────────────────

const updateUser = async (id, data, requesterId, ipAddress) => {
    const user = await repo.findById(id);
    if (!user) throw new AppError('User not found.', 404);

    // Prevent admin from disabling themselves
    if (id === requesterId && data.isActive === false) {
        throw new AppError('You cannot disable your own account.', 400);
    }

    const updateData = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.role !== undefined) {
        const role = await repo.findRoleByName(data.role.toUpperCase());
        if (!role) throw new AppError('Invalid role specified.', 400);
        updateData.roleId = role.id;
    }

    const updated = await repo.update(id, updateData);

    await logActivity({
        action: 'UPDATE',
        userId: requesterId,
        tableName: 'users',
        recordId: id,
        description: `User updated: ${updated.email}`,
        oldValues: { fullName: user.fullName, isActive: user.isActive },
        newValues: updateData,
        ipAddress,
    });

    const { password: _, ...safe } = updated;
    return safe;
};

// ─── Soft-delete user (admin) ────────────────────────────────

const deleteUser = async (id, requesterId, ipAddress) => {
    const user = await repo.findById(id);
    if (!user) throw new AppError('User not found.', 404);

    if (id === requesterId) throw new AppError('You cannot delete your own account.', 400);

    await repo.softDelete(id);

    await logActivity({
        action: 'DELETE',
        userId: requesterId,
        tableName: 'users',
        recordId: id,
        description: `User soft-deleted: ${user.email}`,
        ipAddress,
    });
};

// ─── Reset user password (admin) ─────────────────────────────

const adminResetPassword = async (id, newPassword, requesterId, ipAddress) => {
    const user = await repo.findById(id);
    if (!user) throw new AppError('User not found.', 404);

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await repo.update(id, { password: hashed });

    await logActivity({
        action: 'ADMIN_RESET_PASSWORD',
        userId: requesterId,
        tableName: 'users',
        recordId: id,
        description: `Admin reset password for user: ${user.email}`,
        ipAddress,
    });
};

// ─── Get all roles ────────────────────────────────────────────

const getRoles = async () => {
    return repo.findAllRoles();
};

module.exports = {
    listUsers,
    getUserById,
    updateUser,
    deleteUser,
    adminResetPassword,
    getRoles,
};
