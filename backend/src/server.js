'use strict';

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const { connectDatabase } = require('./config/database');
const { startJobs } = require('./jobs/index');
const logger = require('./utils/logger');
const env = require('./config/env');

const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────
initSocket(server);

// ── Graceful Shutdown ─────────────────────────────────────────
const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(async () => {
        const { disconnectDatabase } = require('./config/database');
        await disconnectDatabase();
        logger.info('Server closed.');
        process.exit(0);
    });
    setTimeout(() => { logger.error('Forced exit after timeout.'); process.exit(1); }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

// ── Boot ──────────────────────────────────────────────────────
const start = async () => {
    await connectDatabase();

    server.listen(env.PORT, () => {
        logger.info(`🚀 ${env.APP_NAME} running on port ${env.PORT} [${env.NODE_ENV}]`);
        logger.info(`📖 API: http://localhost:${env.PORT}/`);
        logger.info(`❤️  Health: http://localhost:${env.PORT}/system/health`);
    });

    // Start cron jobs after server is up
    startJobs();
};

start();
