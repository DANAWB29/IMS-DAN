'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/expense.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const v = require('../validators/expense.validator');
const { ROLES } = require('../constants');

router.use(auth);

// ── Expense Categories ────────────────────────────────────────
router.get('/categories', ctrl.listCategories);
router.post('/categories', role(ROLES.ADMIN), validate(v.createCategory), ctrl.createCategory);
router.patch('/categories/:id', role(ROLES.ADMIN), validate(v.getById), ctrl.updateCategory);
router.delete('/categories/:id', role(ROLES.ADMIN), validate(v.getById), ctrl.deleteCategory);

// ── Expenses ──────────────────────────────────────────────────
router.get('/', validate(v.list), ctrl.list);
router.get('/:id', validate(v.getById), ctrl.getById);
router.post('/', role(ROLES.ADMIN), validate(v.createExpense), ctrl.create);
router.patch('/:id', role(ROLES.ADMIN), validate(v.updateExpense), ctrl.update);
router.delete('/:id', role(ROLES.ADMIN), validate(v.getById), ctrl.remove);

module.exports = router;
