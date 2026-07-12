'use strict';

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const { connectDatabase } = require('./config/database');
const logger = require('./utils/logger');
const env = require('./config/env');

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Graceful shutdown
const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        logger.info('HTTP server closed.');
        const { disconnectDatabase } = require('./config/database');
        await disconnectDatabase();
        process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

const start = async () => {
    await connectDatabase();

    server.listen(env.PORT, () => {
        logger.info(`🚀 ${env.APP_NAME} running on port ${env.PORT} [${env.NODE_ENV}]`);
        logger.info(`📖 API: http://localhost:${env.PORT}/`);
        logger.info(`❤️  Health: http://localhost:${env.PORT}/system/health`);
    });
};

start();
