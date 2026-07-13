'use strict';
const svc = require('../services/purchase.service');
const { success } = require('../utils/apiResponse');
const { HTTP } = require('../constants');

const list = async (req, res, next) => { try { const r = await svc.listPurchases(req.query); return success(res, 'Purchases retrieved.', r.purchases, HTTP.OK, r.meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return success(res, 'Purchase retrieved.', await svc.getPurchaseById(req.params.id)); } catch (e) { next(e); } };
const create = async (req, res, next) => { try { return success(res, 'Purchase created.', await svc.createPurchase(req.body, req.user.id, req.ip), HTTP.CREATED); } catch (e) { next(e); } };
const receive = async (req, res, next) => { try { return success(res, 'Purchase received. Stock updated.', await svc.receivePurchase(req.params.id, req.body, req.user.id, req.ip)); } catch (e) { next(e); } };
const cancel = async (req, res, next) => { try { return success(res, 'Purchase cancelled.', await svc.cancelPurchase(req.params.id, req.user.id, req.ip)); } catch (e) { next(e); } };
const pay = async (req, res, next) => { try { return success(res, 'Payment recorded.', await svc.payPurchase(req.params.id, req.body, req.user.id, req.ip)); } catch (e) { next(e); } };

module.exports = { list, getById, create, receive, cancel, pay };
