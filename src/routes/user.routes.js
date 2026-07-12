'use strict';

const router = require('express').Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const v = require('../validators/user.validator');
const { ROLES } = require('../constants');

// All user management routes require authentication + ADMIN role
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', validate(v.listUsers), userController.listUsers);
router.get('/roles', userController.getRoles);
router.get('/:id', validate(v.getById), userController.getUserById);
router.patch('/:id', validate(v.updateUser), userController.updateUser);
router.delete('/:id', validate(v.deleteUser), userController.deleteUser);
router.patch('/:id/reset-password', userController.adminResetPassword);

module.exports = router;
