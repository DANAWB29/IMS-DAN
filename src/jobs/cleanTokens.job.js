'use strict';

const cron = require('node-cron');
const prisma = require('../prisma');
const logger = require('../utils/logger');

/**
 * Runs every day at 03:00 AM.
 * Cleans up expired refresh tokens and sessions to keep the DB lean.
 */
const cleanTokensJob = cron.schedule('0 3 * * *', async () => {
    logger.info('[Cron] Cleaning expired tokens and sessions...');
    try {
        const [tokens, sessions, resets] = await Promise.all([
            prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
            prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
            prisma.passwordReset.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
        ]);
        logger.info(`[Cron] Cleaned: ${tokens.count} tokens, ${sessions.count} sessions, ${resets.count} resets.`);
    } catch (err) {
        logger.error('[Cron] Token cleanup failed:', err.message);
    }
}, { scheduled: false });

module.exports = cleanTokensJob;
