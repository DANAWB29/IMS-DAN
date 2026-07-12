'use strict';

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Generate a short-lived access token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(payload, jwtConfig.accessToken.secret, {
        expiresIn: jwtConfig.accessToken.expiresIn,
    });
};

/**
 * Generate a long-lived refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, jwtConfig.refreshToken.secret, {
        expiresIn: jwtConfig.refreshToken.expiresIn,
    });
};

/**
 * Verify an access token
 * @returns decoded payload or throws
 */
const verifyAccessToken = (token) => {
    return jwt.verify(token, jwtConfig.accessToken.secret);
};

/**
 * Verify a refresh token
 * @returns decoded payload or throws
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, jwtConfig.refreshToken.secret);
};

/**
 * Decode a token without verifying signature (useful for logging)
 */
const decodeToken = (token) => {
    return jwt.decode(token);
};

/**
 * Build the standard token payload from a user object
 */
const buildTokenPayload = (user) => ({
    id: user.id,
    email: user.email,
    role: user.role.name,
});

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken,
    buildTokenPayload,
};
