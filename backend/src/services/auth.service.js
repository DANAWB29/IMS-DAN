'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../prisma');
const repo = require('../repositories/auth.repository');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    buildTokenPayload,
} = require('../utils/jwt');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');
const { logActivity, logAudit } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const SALT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_MINUTES = 15;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// ─── helpers ────────────────────────────────────────────────

const buildAuthResponse = async (user, ipAddress, userAgent) => {
    const payload = buildTokenPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshTokenValue = generateRefreshToken(payload);

    // Persist refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await repo.createRefreshToken({
        token: refreshTokenValue,
        userId: user.id,
        expiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
    });

    // Create session record
    await repo.createSession({
        userId: user.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt,
    });

    const { password: _, ...safeUser } = user;
    return { accessToken, refreshToken: refreshTokenValue, user: safeUser };
};

const safeUser = (user) => {
    const { password: _, ...rest } = user;
    return rest;
};

// ─── register ───────────────────────────────────────────────

const register = async ({ fullName, email, password, role }, ipAddress, userAgent) => {
    const existing = await repo.findUserByEmail(email);
    if (existing) throw new AppError('An account with this email already exists.', 409);

    const userRole = await repo.findRoleByName(role.toUpperCase());
    if (!userRole) throw new AppError('Invalid role specified.', 400);

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await repo.createUser({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        roleId: userRole.id,
    });

    // Send welcome email (non-blocking — don't fail registration if email fails)
    sendWelcomeEmail(user.email, user.fullName).catch(() => { });

    await logActivity({
        action: 'REGISTER',
        userId: user.id,
        tableName: 'users',
        recordId: user.id,
        description: `New user registered: ${user.email}`,
        ipAddress,
        userAgent,
    });

    await logAudit({
        userId: user.id,
        action: 'REGISTER',
        resource: 'users',
        resourceId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
    });

    return await buildAuthResponse(user, ipAddress, userAgent);
};

// ─── login ──────────────────────────────────────────────────

const login = async ({ email, password }, ipAddress, userAgent) => {
    const user = await repo.findUserByEmail(email.toLowerCase().trim());

    // Use consistent error to prevent user enumeration
    if (!user) {
        await logAudit({
            action: 'LOGIN_FAILED',
            resource: 'users',
            ipAddress,
            userAgent,
            status: 'FAILED',
            details: { reason: 'User not found', email },
        });
        throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
        throw new AppError('Your account has been disabled. Please contact an administrator.', 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        await logAudit({
            userId: user.id,
            action: 'LOGIN_FAILED',
            resource: 'users',
            resourceId: user.id,
            ipAddress,
            userAgent,
            status: 'FAILED',
            details: { reason: 'Invalid password' },
        });
        throw new AppError('Invalid email or password.', 401);
    }

    await repo.updateLastLogin(user.id);

    await logActivity({
        action: 'LOGIN',
        userId: user.id,
        tableName: 'users',
        recordId: user.id,
        description: `User logged in: ${user.email}`,
        ipAddress,
        userAgent,
    });

    await logAudit({
        userId: user.id,
        action: 'LOGIN',
        resource: 'users',
        resourceId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
    });

    return await buildAuthResponse(user, ipAddress, userAgent);
};

// ─── refresh token ──────────────────────────────────────────

const refresh = async (token, ipAddress, userAgent) => {
    const stored = await repo.findRefreshToken(token);

    if (!stored) throw new AppError('Invalid refresh token.', 401);
    if (stored.isRevoked) throw new AppError('Refresh token has been revoked.', 401);
    if (stored.expiresAt < new Date()) throw new AppError('Refresh token has expired. Please log in again.', 401);

    // Verify JWT signature
    try {
        verifyRefreshToken(token);
    } catch {
        throw new AppError('Invalid refresh token signature.', 401);
    }

    const user = stored.user;
    if (!user.isActive) throw new AppError('Account has been disabled.', 401);

    // Rotate: revoke old, issue new
    await repo.revokeRefreshToken(token);
    return await buildAuthResponse(user, ipAddress, userAgent);
};

// ─── logout ─────────────────────────────────────────────────

const logout = async (token, userId) => {
    if (token) {
        const stored = await repo.findRefreshToken(token);
        if (stored) await repo.revokeRefreshToken(token);
    }
    await repo.deactivateAllUserSessions(userId);

    await logActivity({
        action: 'LOGOUT',
        userId,
        tableName: 'users',
        recordId: userId,
        description: 'User logged out',
    });
};

// ─── forgot password ────────────────────────────────────────

const forgotPassword = async (email, ipAddress) => {
    const user = await repo.findUserByEmail(email.toLowerCase().trim());

    // Always respond with the same message to prevent enumeration
    if (!user) return;

    // Invalidate previous reset tokens
    await repo.invalidateUserPasswordResets(user.id);

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);

    await repo.createPasswordReset({
        token: hashedToken,
        userId: user.id,
        expiresAt,
    });

    // Send email with the raw (un-hashed) token
    await sendPasswordResetEmail(user.email, user.fullName, rawToken).catch(() => { });

    await logAudit({
        userId: user.id,
        action: 'FORGOT_PASSWORD',
        resource: 'users',
        resourceId: user.id,
        ipAddress,
        status: 'SUCCESS',
    });
};

// ─── reset password ─────────────────────────────────────────

const resetPassword = async (rawToken, newPassword, ipAddress) => {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await repo.findPasswordReset(hashedToken);

    if (!record) throw new AppError('Invalid or expired reset token.', 400);
    if (record.isUsed) throw new AppError('This reset token has already been used.', 400);
    if (record.expiresAt < new Date()) throw new AppError('Reset token has expired. Please request a new one.', 400);

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
        prisma.user.update({ where: { id: record.userId }, data: { password: hashedPassword } }),
        prisma.passwordReset.update({ where: { id: record.id }, data: { isUsed: true } }),
    ]);

    // Revoke all existing refresh tokens for security
    await repo.revokeAllUserRefreshTokens(record.userId);

    await logAudit({
        userId: record.userId,
        action: 'RESET_PASSWORD',
        resource: 'users',
        resourceId: record.userId,
        ipAddress,
        status: 'SUCCESS',
    });
};

// ─── change password ────────────────────────────────────────

const changePassword = async (userId, currentPassword, newPassword, ipAddress) => {
    const user = await repo.findUserById(userId);
    if (!user) throw new AppError('User not found.', 404);

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) throw new AppError('Current password is incorrect.', 400);

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) throw new AppError('New password must be different from your current password.', 400);

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await repo.updateUser(userId, { password: hashedPassword });

    // Revoke all refresh tokens to force re-login on other devices
    await repo.revokeAllUserRefreshTokens(userId);

    await logAudit({
        userId,
        action: 'CHANGE_PASSWORD',
        resource: 'users',
        resourceId: userId,
        ipAddress,
        status: 'SUCCESS',
    });
};

// ─── current user (me) ──────────────────────────────────────

const getMe = async (userId) => {
    const user = await repo.findUserById(userId);
    if (!user) throw new AppError('User not found.', 404);
    return safeUser(user);
};

// ─── update profile ─────────────────────────────────────────

const updateProfile = async (userId, data) => {
    const user = await repo.updateUser(userId, data);
    return safeUser(user);
};

module.exports = {
    register,
    login,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    getMe,
    updateProfile,
};
