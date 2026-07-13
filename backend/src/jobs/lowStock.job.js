'use strict';

const cron = require('node-cron');
const prisma = require('../prisma');
const { notifyAdmins } = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * Runs every day at 07:00 AM.
 * Finds products where current stock < minimumStock and creates notifications.
 */
const lowStockJob = cron.schedule('0 7 * * *', async () => {
    logger.info('[Cron] Running low stock check...');
    try {
        const lowStockProducts = await prisma.$queryRaw`
      SELECT p.id, p.name, p.sku, p."minimumStock",
             COALESCE(SUM(b."remainingQty"), 0)::int AS "currentStock"
      FROM products p
      LEFT JOIN batches b ON b."productId" = p.id AND b."isDeleted" = false
      WHERE p."isDeleted" = false AND p."isActive" = true
      GROUP BY p.id, p.name, p.sku, p."minimumStock"
      HAVING COALESCE(SUM(b."remainingQty"), 0) < p."minimumStock"
    `;

        for (const product of lowStockProducts) {
            await notifyAdmins(
                'Low Stock Alert',
                `"${product.name}" (SKU: ${product.sku}) is running low. Current: ${product.currentStock}, Minimum: ${product.minimumStock}.`,
                'LOW_STOCK',
                `/products/${product.id}`
            );
        }

        if (lowStockProducts.length > 0) {
            logger.info(`[Cron] Low stock check: ${lowStockProducts.length} product(s) below minimum.`);
        } else {
            logger.info('[Cron] Low stock check: All products above minimum stock levels.');
        }
    } catch (err) {
        logger.error('[Cron] Low stock job failed:', err.message);
    }
}, { scheduled: false });

module.exports = lowStockJob;
