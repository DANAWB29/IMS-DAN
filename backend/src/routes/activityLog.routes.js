'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/activityLog.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { ROLES } = require('../constants');

router.use(auth, role(ROLES.ADMIN));

router.get('/activity', ctrl.listActivityLogs);
router.get('/audit', ctrl.listAuditLogs);

module.exports = router;
