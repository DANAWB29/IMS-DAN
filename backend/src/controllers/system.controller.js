'use strict';

const prisma = require('../prisma');
const { success } = require('../utils/apiResponse');
const env = require('../config/env');

const healthCheck = async (req, res) => {
    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - start;

        return success(res, 'System is healthy.', {
            status: 'OK',
            app: env.APP_NAME,
            version: '1.0.0',
            environment: env.NODE_ENV,
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(process.uptime())}s`,
            database: { status: 'connected', latencyMs: dbLatency },
            memory: {
                used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
            },
        });
    } catch (err) {
        return res.status(503).json({
            success: false,
            message: 'Database connection failed.',
            timestamp: new Date().toISOString(),
        });
    }
};

module.exports = { healthCheck };
