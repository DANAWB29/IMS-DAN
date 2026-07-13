'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/sales.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const v = require('../validators/sale.validator');
const { ROLES } = require('../constants');

router.use(auth);
router.get('/today', ctrl.todaySummary);
router.get('/summary', ctrl.summary);
router.get('/top-products', ctrl.topProducts);
router.get('/', validate(v.list), ctrl.list);
router.get('/:id', validate(v.getById), ctrl.getById);
router.post('/', validate(v.create), ctrl.create);
router.post('/:id/return', validate(v.processReturn), ctrl.processReturn);
router.post('/:id/payment', ctrl.recordPayment);

module.exports = router;
