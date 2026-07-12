'use strict';

const { getIO } = require('../config/socket');
const logger = require('../utils/logger');

/**
 * Emit a real-time notification to a specific user
 */
const emitToUser = (userId, event, data) => {
    try {
        getIO().to(`user:${userId}`).emit(event, data);
    } catch (err) {
        logger.error(`Socket emit to user ${userId} failed: ${err.message}`);
    }
};

/**
 * Emit a real-time notification to all admins
 */
const emitToAdmins = (event, data) => {
    try {
        getIO().to('admin').emit(event, data);
    } catch (err) {
        logger.error(`Socket emit to admin room failed: ${err.message}`);
    }
};

/**
 * Broadcast to all connected clients
 */
const broadcast = (event, data) => {
    try {
        getIO().emit(event, data);
    } catch (err) {
        logger.error(`Socket broadcast failed: ${err.message}`);
    }
};

module.exports = { emitToUser, emitToAdmins, broadcast };
