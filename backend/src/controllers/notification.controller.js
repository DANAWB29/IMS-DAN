'use strict';
const svc = require('../services/notification.service');
const { success } = require('../utils/apiResponse');

const list = async (req, res, next) => { try { const r = await svc.listNotifications(req.user.id, req.query); return success(res, 'Notifications retrieved.', r.notifications, 200, { ...r.meta, unreadCount: r.unreadCount }); } catch (e) { next(e); } };
const markRead = async (req, res, next) => { try { return success(res, 'Marked as read.', await svc.markRead(req.params.id, req.user.id)); } catch (e) { next(e); } };
const markAll = async (req, res, next) => { try { await svc.markAllRead(req.user.id); return success(res, 'All notifications marked as read.'); } catch (e) { next(e); } };
const remove = async (req, res, next) => { try { await svc.deleteNotification(req.params.id); return success(res, 'Notification deleted.'); } catch (e) { next(e); } };

module.exports = { list, markRead, markAll, remove };
