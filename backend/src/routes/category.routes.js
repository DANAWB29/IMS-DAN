'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/category.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const v = require('../validators/category.validator');
const { ROLES } = require('../constants');

router.use(auth);

router.get('/', validate(v.list), ctrl.list);
router.get('/:id', validate(v.getById), ctrl.getById);
router.post('/', role(ROLES.ADMIN), validate(v.create), ctrl.create);
router.patch('/:id', role(ROLES.ADMIN), validate(v.update), ctrl.update);
router.delete('/:id', role(ROLES.ADMIN), validate(v.getById), ctrl.remove);

module.exports = router;
