'use strict';

const prisma = require('../prisma');

const findUserByEmail = (email) =>
    prisma.user.findUnique({
        where: { email, isDeleted: false },
        include: { role: true },
    });

const findUserById = (id) =>
    prisma.user.findUnique({
        where: { id, isDeleted: false },
        include: { role: true },
    });

const findRoleByName = (name) =>
    prisma.role.findUnique({ where: { name } });

const createUser = (data) =>
    prisma.user.create({
        data,
        include: { role: true },
    });

const updateLastLogin = (id) =>
    prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() },
        include: { role: true },
    });

const updateUser = (id, data) =>
    prisma.user.update({
        where: { id },
        data,
        include: { role: true },
    });

// ── Refresh Tokens ──────────────────────────────────────────

const createRefreshToken = (data) =>
    prisma.refreshToken.create({ data });

const findRefreshToken = (token) =>
    prisma.refreshToken.findUnique({
        where: { token },
        include: { user: { include: { role: true } } },
    });

const revokeRefreshToken = (token) =>
    prisma.refreshToken.update({
        where: { token },
        data: { isRevoked: true },
    });

const revokeAllUserRefreshTokens = (userId) =>
    prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
    });

const deleteExpiredRefreshTokens = () =>
    prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
    });

// ── Password Reset ───────────────────────────────────────────

const createPasswordReset = (data) =>
    prisma.passwordReset.create({ data });

const findPasswordReset = (token) =>
    prisma.passwordReset.findUnique({
        where: { token },
        include: { user: { include: { role: true } } },
    });

const markPasswordResetUsed = (id) =>
    prisma.passwordReset.update({
        where: { id },
        data: { isUsed: true },
    });

const invalidateUserPasswordResets = (userId) =>
    prisma.passwordReset.updateMany({
        where: { userId, isUsed: false },
        data: { isUsed: true },
    });

// ── Sessions ──────────────────────────────────────────────────

const createSession = (data) =>
    prisma.session.create({ data });

const deactivateSession = (id) =>
    prisma.session.update({
        where: { id },
        data: { isActive: false },
    });

const deactivateAllUserSessions = (userId) =>
    prisma.session.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
    });

module.exports = {
    findUserByEmail,
    findUserById,
    findRoleByName,
    createUser,
    updateLastLogin,
    updateUser,
    createRefreshToken,
    findRefreshToken,
    revokeRefreshToken,
    revokeAllUserRefreshTokens,
    deleteExpiredRefreshTokens,
    createPasswordReset,
    findPasswordReset,
    markPasswordResetUsed,
    invalidateUserPasswordResets,
    createSession,
    deactivateSession,
    deactivateAllUserSessions,
};
