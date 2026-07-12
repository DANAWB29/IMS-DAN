'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const v = require('../validators/product.validator');
const { uploadProductImages } = require('../middleware/upload.middleware');
const { ROLES } = require('../constants');

router.use(auth);

// Special routes first
router.get('/inventory-value', role(ROLES.ADMIN), ctrl.getInventoryValue);
router.get('/low-stock', ctrl.getLowStock);
router.get('/barcode/:barcode', ctrl.getByBarcode);

// CRUD
router.get('/', validate(v.list), ctrl.list);
router.get('/:id', validate(v.getById), ctrl.getById);
router.post('/', role(ROLES.ADMIN), validate(v.create), ctrl.create);
router.patch('/:id', role(ROLES.ADMIN), validate(v.update), ctrl.update);
router.delete('/:id', role(ROLES.ADMIN), validate(v.getById), ctrl.remove);

// Images
router.post('/:id/images', role(ROLES.ADMIN), uploadProductImages.array('images', 5), ctrl.uploadImages);
router.patch('/:id/images/:imageId/primary', role(ROLES.ADMIN), ctrl.setPrimaryImage);
router.delete('/:id/images/:imageId', role(ROLES.ADMIN), ctrl.deleteImage);

module.exports = router;
