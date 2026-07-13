'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/setting.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { ROLES } = require('../constants');

router.use(auth);

router.get('/', ctrl.getSettings);
router.patch('/bulk', role(ROLES.ADMIN), ctrl.bulkUpdateSettings);
router.patch('/:key', role(ROLES.ADMIN), ctrl.updateSetting);

module.exports = router;
