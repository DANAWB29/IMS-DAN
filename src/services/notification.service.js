'use strict';

const repo = require('../repositories/notification.repository');
const { sendToUser, sendToAdmins } = require('../config/socket');
const { paginate } = require('../utils/apiResponse');
const { parsePagination } = require('../utils/pagination');
const AppError = require('../utils/AppError');

/**
 * Create and broadcast a notification
 */
const createNotification = async ({ userId = null, title, message, type, channel = 'IN_APP', link = null }) => {
    const notification = await repo.create({ userId, title, message, type, channel, link });

    // Real-time broadcast
    if (userId) {
        sendToUser(userId, 'notification', notification);
    } else {
        sendToAdmins('notification', notification);
    }

    return notification;
};

/**
 * Broadcast to all admins — used by cron jobs
 */
const notifyAdmins = async (title, message, type, link = null) => {
    return createNotification({ userId: null, title, message, type, channel: 'IN_APP', link });
};

const listNotifications = async (userId, query) => {
    const { page, limit, skip } = parsePagination(query);
    const isRead = query.isRead !== undefined ? (query.isRead === 'true' || query.isRead === true) : undefined;

    const [notifications, total] = await Promise.all([
        repo.findAll({ userId, skip, take: limit, isRead }),
        repo.count(userId, isRead),
    ]);

    const unreadCount = await repo.getUnreadCount(userId);
    return { notifications, meta: paginate(total, page, limit), unreadCount };
};

const markRead = async (id, userId) => {
    const notification = await repo.markRead(id);
    if (!notification) throw new AppError('Notification not found.', 404);
    return notification;
};

const markAllRead = async (userId) => {
    await repo.markAllRead(userId);
};

const deleteNotification = async (id) => {
    await repo.softDelete(id);
};

module.exports = { createNotification, notifyAdmins, listNotifications, markRead, markAllRead, deleteNotification };
