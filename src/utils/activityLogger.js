'use strict';

const prisma = require('../prisma');
const logger = require('./logger');

/**
 * Log an activity to the database
 * @param {object} params
 * @param {string} params.action - e.g. 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
 * @param {string|null} params.userId - ID of user performing the action
 * @param {string} params.tableName - DB table affected
 * @param {string} params.recordId - ID of the record affected
 * @param {string|null} params.description - Human-readable description
 * @param {object|null} params.oldValues - Values before change
 * @param {object|null} params.newValues - Values after change
 * @param {string|null} params.ipAddress
 * @param {string|null} params.userAgent
 */
const logActivity = async ({
    action,
    userId = null,
    tableName,
    recordId,
    description = null,
    oldValues = null,
    newValues = null,
    ipAddress = null,
    userAgent = null,
}) => {
    try {
        await prisma.activityLog.create({
            data: {
                action,
                userId,
                tableName,
                recordId,
                description,
                oldValues,
                newValues,
                ipAddress,
                userAgent,
            },
        });
    } catch (err) {
        // Activity logging must never crash the app
        logger.error(`Failed to log activity: ${err.message}`);
    }
};

/**
 * Log an audit event (security-focused)
 */
const logAudit = async ({
    userId = null,
    action,
    resource,
    resourceId = null,
    ipAddress = null,
    userAgent = null,
    status = 'SUCCESS',
    details = null,
}) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                resourceId,
                ipAddress,
                userAgent,
                status,
                details,
            },
        });
    } catch (err) {
        logger.error(`Failed to log audit event: ${err.message}`);
    }
};

module.exports = { logActivity, logAudit };
