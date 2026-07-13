'use strict';

const prisma = require('../prisma');
const { success } = require('../utils/apiResponse');
const { parsePagination } = require('../utils/pagination');
const { paginate } = require('../utils/apiResponse');

const listActivityLogs = async (req, res, next) => {
    try {
        const { page, limit, skip, sortBy, sortOrder } = parsePagination(req.query, ['createdAt']);
        const where = {};
        if (req.query.userId) where.userId = req.query.userId;
        if (req.query.action) where.action = { contains: req.query.action, mode: 'insensitive' };
        if (req.query.tableName) where.tableName = req.query.tableName;
        if (req.query.startDate || req.query.endDate) {
            where.createdAt = {};
            if (req.query.startDate) where.createdAt.gte = new Date(req.query.startDate);
            if (req.query.endDate) where.createdAt.lte = new Date(req.query.endDate);
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: { user: { select: { id: true, fullName: true, email: true } } },
                skip, take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.activityLog.count({ where }),
        ]);

        return success(res, 'Activity logs retrieved.', logs, 200, paginate(total, page, limit));
    } catch (e) { next(e); }
};

const listAuditLogs = async (req, res, next) => {
    try {
        const { page, limit, skip, sortBy, sortOrder } = parsePagination(req.query, ['createdAt']);
        const where = {};
        if (req.query.userId) where.userId = req.query.userId;
        if (req.query.action) where.action = { contains: req.query.action, mode: 'insensitive' };
        if (req.query.resource) where.resource = req.query.resource;
        if (req.query.status) where.status = req.query.status;
        if (req.query.startDate || req.query.endDate) {
            where.createdAt = {};
            if (req.query.startDate) where.createdAt.gte = new Date(req.query.startDate);
            if (req.query.endDate) where.createdAt.lte = new Date(req.query.endDate);
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: { user: { select: { id: true, fullName: true, email: true } } },
                skip, take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return success(res, 'Audit logs retrieved.', logs, 200, paginate(total, page, limit));
    } catch (e) { next(e); }
};

module.exports = { listActivityLogs, listAuditLogs };
