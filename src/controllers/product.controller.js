'use strict';

const svc = require('../services/product.service');
const { success } = require('../utils/apiResponse');
const { HTTP } = require('../constants');

const list = async (req, res, next) => {
    try {
        const r = await svc.listProducts(req.query);
        return success(res, 'Products retrieved.', r.products, HTTP.OK, r.meta);
    } catch (e) { next(e); }
};

const getById = async (req, res, next) => {
    try { return success(res, 'Product retrieved.', await svc.getProductById(req.params.id)); }
    catch (e) { next(e); }
};

const getByBarcode = async (req, res, next) => {
    try { return success(res, 'Product retrieved.', await svc.getProductByBarcode(req.params.barcode)); }
    catch (e) { next(e); }
};

const create = async (req, res, next) => {
    try { return success(res, 'Product created.', await svc.createProduct(req.body, req.user.id, req.ip), HTTP.CREATED); }
    catch (e) { next(e); }
};

const update = async (req, res, next) => {
    try { return success(res, 'Product updated.', await svc.updateProduct(req.params.id, req.body, req.user.id, req.ip)); }
    catch (e) { next(e); }
};

const remove = async (req, res, next) => {
    try { await svc.deleteProduct(req.params.id, req.user.id, req.ip); return success(res, 'Product deleted.'); }
    catch (e) { next(e); }
};

const uploadImages = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded.' });
        const images = await svc.uploadProductImages(req.params.id, req.files, req.user.id);
        return success(res, 'Images uploaded.', images, HTTP.CREATED);
    } catch (e) { next(e); }
};

const setPrimaryImage = async (req, res, next) => {
    try { return success(res, 'Primary image set.', await svc.setPrimaryImage(req.params.id, req.params.imageId, req.user.id)); }
    catch (e) { next(e); }
};

const deleteImage = async (req, res, next) => {
    try { await svc.deleteProductImage(req.params.id, req.params.imageId, req.user.id); return success(res, 'Image deleted.'); }
    catch (e) { next(e); }
};

const getInventoryValue = async (req, res, next) => {
    try { return success(res, 'Inventory value retrieved.', await svc.getInventoryValue()); }
    catch (e) { next(e); }
};

const getLowStock = async (req, res, next) => {
    try { return success(res, 'Low stock products retrieved.', await svc.getLowStockProducts()); }
    catch (e) { next(e); }
};

module.exports = { list, getById, getByBarcode, create, update, remove, uploadImages, setPrimaryImage, deleteImage, getInventoryValue, getLowStock };
