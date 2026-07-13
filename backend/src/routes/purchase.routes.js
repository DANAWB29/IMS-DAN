'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/purchase.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const v = require('../validators/purchase.validator');
const { ROLES } = require('../constants');

router.use(auth);
router.get('/', validate(v.list), ctrl.list);
router.get('/:id', validate(v.getById), ctrl.getById);
router.post('/', role(ROLES.ADMIN), validate(v.create), ctrl.create);
router.patch('/:id/receive', role(ROLES.ADMIN), validate(v.receive), ctrl.receive);
router.patch('/:id/cancel', role(ROLES.ADMIN), validate(v.getById), ctrl.cancel);
router.post('/:id/pay', role(ROLES.ADMIN), validate(v.pay), ctrl.pay);

module.exports = router;
