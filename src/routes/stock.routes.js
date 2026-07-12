'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/stock.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const v = require('../validators/stock.validator');
const { ROLES } = require('../constants');

router.use(auth);
router.get('/movements', validate(v.listMovements), ctrl.listMovements);
router.get('/expiring', ctrl.getExpiring);
router.get('/batches/:productId', ctrl.getBatches);
router.post('/in', role(ROLES.ADMIN), validate(v.stockIn), ctrl.stockIn);
router.post('/out', role(ROLES.ADMIN), validate(v.stockOut), ctrl.stockOut);
router.post('/adjustment', role(ROLES.ADMIN), validate(v.adjustment), ctrl.adjustment);

module.exports = router;
