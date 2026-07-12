'use strict';
const svc = require('../services/supplier.service');
const { success } = require('../utils/apiResponse');
const { HTTP } = require('../constants');

const list = async (req, res, next) => { try { const r = await svc.listSuppliers(req.query); return success(res, 'Suppliers retrieved.', r.suppliers, HTTP.OK, r.meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return success(res, 'Supplier retrieved.', await svc.getSupplierById(req.params.id)); } catch (e) { next(e); } };
const create = async (req, res, next) => { try { return success(res, 'Supplier created.', await svc.createSupplier(req.body, req.user.id, req.ip), HTTP.CREATED); } catch (e) { next(e); } };
const update = async (req, res, next) => { try { return success(res, 'Supplier updated.', await svc.updateSupplier(req.params.id, req.body, req.user.id, req.ip)); } catch (e) { next(e); } };
const remove = async (req, res, next) => { try { await svc.deleteSupplier(req.params.id, req.user.id, req.ip); return success(res, 'Supplier deleted.'); } catch (e) { next(e); } };

module.exports = { list, getById, create, update, remove };
