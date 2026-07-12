'use strict';

const router = require('express').Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const employeeRoutes = require('./employee.routes');
const systemRoutes = require('./system.routes');

// ── API Info ─────────────────────────────────────────────────
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Inventory Management System API',
        version: '1.0.0',
        docs: '/api-docs',
    });
});

// ── Route Mounting ───────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/system', systemRoutes);

module.exports = router;
