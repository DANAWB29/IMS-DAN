'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { ROLES } = require('../constants');

router.use(auth, role(ROLES.ADMIN));

router.get('/dashboard', ctrl.dashboard);
router.get('/sales', ctrl.salesReport);
router.get('/inventory', ctrl.inventoryReport);
router.get('/employees', ctrl.employeeReport);
router.get('/expenses', ctrl.expenseReport);
router.get('/profit-loss', ctrl.profitLoss);

module.exports = router;
