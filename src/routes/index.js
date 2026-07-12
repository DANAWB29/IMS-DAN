'use strict';

const router = require('express').Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const employeeRoutes = require('./employee.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const supplierRoutes = require('./supplier.routes');
const purchaseRoutes = require('./purchase.routes');
const stockRoutes = require('./stock.routes');
const customerRoutes = require('./customer.routes');
const salesRoutes = require('./sales.routes');
const expenseRoutes = require('./expense.routes');
const reportRoutes = require('./reports.routes');
const notificationRoutes = require('./notification.routes');
const logRoutes = require('./activityLog.routes');
const settingRoutes = require('./setting.routes');
const systemRoutes = require('./system.routes');

// ── API root ─────────────────────────────────────────────────
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Inventory Management System API v1.0.0',
        endpoints: {
            auth: '/auth',
            users: '/users',
            employees: '/employees',
            categories: '/categories',
            products: '/products',
            suppliers: '/suppliers',
            purchases: '/purchases',
            stock: '/stock',
            customers: '/customers',
            sales: '/sales',
            expenses: '/expenses',
            reports: '/reports',
            notifications: '/notifications',
            logs: '/logs',
            settings: '/settings',
            system: '/system',
        },
    });
});

// ── Mount ────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/stock', stockRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', salesRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/logs', logRoutes);
router.use('/settings', settingRoutes);
router.use('/system', systemRoutes);

module.exports = router;
