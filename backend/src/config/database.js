'use strict';

const prisma = require('../prisma');
const logger = require('../utils/logger');

const connectDatabase = async () => {
    try {
        await prisma.$connect();
        logger.info('PostgreSQL database connected successfully.');
    } catch (error) {
        logger.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

const disconnectDatabase = async () => {
    try {
        await prisma.$disconnect();
        logger.info('Database disconnected.');
    } catch (error) {
        logger.error('Error disconnecting database:', error.message);
    }
};

module.exports = { connectDatabase, disconnectDatabase };
