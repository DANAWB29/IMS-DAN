'use strict';
const prisma = require('../prisma');

const create = (data) => prisma.notification.create({ data });

const findAll = ({ userId, skip, take, isRead }) =>
    prisma.notification.findMany({
        where: { isDeleted: false, ...(userId ? { userId } : {}), ...(isRead !== undefined ? { isRead } : {}) },
        orderBy: { createdAt: 'desc' },
        skip, take,
    });

const count = (userId, isRead) =>
    prisma.notification.count({
        where: { isDeleted: false, ...(userId ? { userId } : {}), ...(isRead !== undefined ? { isRead } : {}) },
    });

const markRead = (id) => prisma.notification.update({ where: { id }, data: { isRead: true } });

const markAllRead = (userId) =>
    prisma.notification.updateMany({ where: { userId, isRead: false, isDeleted: false }, data: { isRead: true } });

const softDelete = (id) => prisma.notification.update({ where: { id }, data: { isDeleted: true } });

const getUnreadCount = (userId) =>
    prisma.notification.count({ where: { userId, isRead: false, isDeleted: false } });

module.exports = { create, findAll, count, markRead, markAllRead, softDelete, getUnreadCount };
