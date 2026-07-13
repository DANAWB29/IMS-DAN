'use strict';
const svc = require('../services/stock.service');
const { success } = require('../utils/apiResponse');
const { HTTP } = require('../constants');

const stockIn = async (req, res, next) => { try { return success(res, 'Stock in recorded.', await svc.stockIn(req.body, req.user.id, req.ip), HTTP.CREATED); } catch (e) { next(e); } };
const stockOut = async (req, res, next) => { try { return success(res, 'Stock out recorded.', await svc.stockOut(req.body, req.user.id, req.ip), HTTP.CREATED); } catch (e) { next(e); } };
const adjustment = async (req, res, next) => { try { return success(res, 'Stock adjusted.', await svc.adjustment(req.body, req.user.id, req.ip)); } catch (e) { next(e); } };
const listMovements = async (req, res, next) => { try { const r = await svc.listMovements(req.query); return success(res, 'Movements retrieved.', r.movements, HTTP.OK, r.meta); } catch (e) { next(e); } };
const getBatches = async (req, res, next) => { try { return success(res, 'Batches retrieved.', await svc.getBatchesByProduct(req.params.productId)); } catch (e) { next(e); } };
const getExpiring = async (req, res, next) => { try { return success(res, 'Expiring products retrieved.', await svc.getExpiringProducts(req.query.days)); } catch (e) { next(e); } };

module.exports = { stockIn, stockOut, adjustment, listMovements, getBatches, getExpiring };
