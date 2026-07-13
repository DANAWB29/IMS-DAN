'use strict';
const svc = require('../services/customer.service');
const { success } = require('../utils/apiResponse');
const { HTTP } = require('../constants');

const list = async (req, res, next) => { try { const r = await svc.listCustomers(req.query); return success(res, 'Customers retrieved.', r.customers, HTTP.OK, r.meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return success(res, 'Customer retrieved.', await svc.getCustomerById(req.params.id)); } catch (e) { next(e); } };
const history = async (req, res, next) => { try { const r = await svc.getCustomerHistory(req.params.id, req.query); return success(res, 'History retrieved.', r, HTTP.OK); } catch (e) { next(e); } };
const create = async (req, res, next) => { try { return success(res, 'Customer created.', await svc.createCustomer(req.body, req.user.id, req.ip), HTTP.CREATED); } catch (e) { next(e); } };
const update = async (req, res, next) => { try { return success(res, 'Customer updated.', await svc.updateCustomer(req.params.id, req.body, req.user.id, req.ip)); } catch (e) { next(e); } };
const remove = async (req, res, next) => { try { await svc.deleteCustomer(req.params.id, req.user.id, req.ip); return success(res, 'Customer deleted.'); } catch (e) { next(e); } };

module.exports = { list, getById, history, create, update, remove };
