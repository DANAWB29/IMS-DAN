'use strict';

const prisma = require('../prisma');
const { success } = require('../utils/apiResponse');
const { logActivity } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');

// Get all public + admin settings
const getSettings = async (req, res, next) => {
    try {
        const isAdmin = req.user.role.name === 'ADMIN';
        const settings = await prisma.setting.findMany({
            where: isAdmin ? {} : { isPublic: true },
            orderBy: { key: 'asc' },
        });
        // Convert array to key-value map for easy frontend consumption
        const map = {};
        settings.forEach((s) => { map[s.key] = s.value; });
        return success(res, 'Settings retrieved.', map);
    } catch (e) { next(e); }
};

// Update a single setting by key
const updateSetting = async (req, res, next) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined || value === null) {
            return next(new AppError('value is required.', 400));
        }

        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
        });

        await logActivity({
            action: 'UPDATE_SETTING', userId: req.user.id,
            tableName: 'settings', recordId: setting.id,
            description: `Setting updated: ${key} = ${value}`, ipAddress: req.ip
        });

        return success(res, 'Setting updated.', setting);
    } catch (e) { next(e); }
};

// Bulk update settings
const bulkUpdateSettings = async (req, res, next) => {
    try {
        const { settings } = req.body;
        if (!settings || typeof settings !== 'object') {
            return next(new AppError('settings object is required.', 400));
        }

        const results = [];
        for (const [key, value] of Object.entries(settings)) {
            const s = await prisma.setting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
            });
            results.push(s);
        }

        await logActivity({
            action: 'BULK_UPDATE_SETTINGS', userId: req.user.id,
            tableName: 'settings', recordId: 'bulk',
            description: `Bulk settings updated: ${Object.keys(settings).join(', ')}`, ipAddress: req.ip
        });

        return success(res, 'Settings updated.', results);
    } catch (e) { next(e); }
};

module.exports = { getSettings, updateSetting, bulkUpdateSettings };
