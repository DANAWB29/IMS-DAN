'use strict';

const cron = require('node-cron');
const prisma = require('../prisma');
const { notifyAdmins } = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * Runs every day at 07:30 AM.
 * Finds batches expiring within 30 days and batches already expired.
 */
const expiryJob = cron.schedule('30 7 * * *', async () => {
    logger.info('[Cron] Running expiry check...');
    try {
        const now = new Date();
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Expiring soon
        const expiringSoon = await prisma.batch.findMany({
            where: {
                isDeleted: false,
                remainingQty: { gt: 0 },
                expiryDate: { gte: now, lte: in30Days },
            },
            include: { product: { select: { id: true, name: true, sku: true } } },
            orderBy: { expiryDate: 'asc' },
        });

        // Already expired with remaining stock
        const expired = await prisma.batch.findMany({
            where: { isDeleted: false, remainingQty: { gt: 0 }, expiryDate: { lt: now } },
            include: { product: { select: { id: true, name: true, sku: true } } },
        });

        for (const batch of expiringSoon) {
            const days = Math.ceil((new Date(batch.expiryDate) - now) / (1000 * 60 * 60 * 24));
            await notifyAdmins(
                'Expiry Warning',
                `Batch "${batch.batchNumber}" of "${batch.product.name}" expires in ${days} day(s). Qty: ${batch.remainingQty}.`,
                'EXPIRY',
                `/products/${batch.product.id}`
            );
        }

        for (const batch of expired) {
            await notifyAdmins(
                'Expired Stock Alert',
                `Batch "${batch.batchNumber}" of "${batch.product.name}" has expired and still has ${batch.remainingQty} unit(s) remaining.`,
                'EXPIRY',
                `/products/${batch.product.id}`
            );
        }

        logger.info(`[Cron] Expiry check: ${expiringSoon.length} expiring, ${expired.length} expired.`);
    } catch (err) {
        logger.error('[Cron] Expiry job failed:', err.message);
    }
}, { scheduled: false });

module.exports = expiryJob;
