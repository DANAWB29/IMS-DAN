'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../prisma');
const AppError = require('../utils/AppError');
const { HTTP } = require('../constants');

/**
 * Authenticate incoming requests using JWT access token.
 * Attaches full user object (with role) to req.user.
 */
const authenticate = async (req, res, next) => {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith('Bearer ')) {
            return next(new AppError('Authentication required. Please provide a Bearer token.', HTTP.UNAUTHORIZED));
        }

        const token = header.split(' ')[1];

        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return next(new AppError('Access token expired. Please refresh your session.', HTTP.UNAUTHORIZED));
            }
            return next(new AppError('Invalid access token.', HTTP.UNAUTHORIZED));
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id, isDeleted: false },
            include: { role: true },
        });

        if (!user) {
            return next(new AppError('User account not found.', HTTP.UNAUTHORIZED));
        }

        if (!user.isActive) {
            return next(new AppError('Your account has been disabled. Contact an administrator.', HTTP.UNAUTHORIZED));
        }

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = authenticate;
