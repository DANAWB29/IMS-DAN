'use strict';

const lowStockJob = require('./lowStock.job');
const expiryJob = require('./expiry.job');
const cleanTokensJob = require('./cleanTokens.job');
const logger = require('../utils/logger');

const startJobs = () => {
    lowStockJob.start();
    expiryJob.start();
    cleanTokensJob.start();
    logger.info('⏰ Cron jobs started: lowStock (07:00), expiry (07:30), cleanTokens (03:00)');
};

module.exports = { startJobs };
