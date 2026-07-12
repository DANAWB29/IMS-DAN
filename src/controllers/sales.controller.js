'use strict';
const svc = require('../services/sale.service');
const { success } = require('../utils/apiResponse');
const { HTTP } = require('../constants');

const list = async (req, res, next) => { try { const r = await svc.listSales(req.query); return success(res, 'Sales retrieved.', r.sales, HTTP.OK, r.meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return success(res, 'Sale retrieved.', await svc.getSaleById(req.params.id)); } catch (e) { next(e); } };
const create = async (req, res, next) => { try { return success(res, 'Sale created.', await svc.createSale(req.body, req.user.id, req.ip), HTTP.CREATED); } catch (e) { next(e); } };
const processReturn = async (req, res, next) => { try { return success(res, 'Return processed.', await svc.processReturn(req.params.id, req.body, req.user.id, req.ip), HTTP.CREATED); } catch (e) { next(e); } };
const todaySummary = async (req, res, next) => { try { return success(res, "Today's summary.", await svc.getTodaySummary()); } catch (e) { next(e); } };
const summary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'startDate and endDate required.' });
        return success(res, 'Sales summary.', await svc.getSalesSummary(startDate, endDate));
    } catch (e) { next(e); }
};
const topProducts = async (req, res, next) => {
    try {
        const { startDate, endDate, limit } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'startDate and endDate required.' });
        return success(res, 'Top products.', await svc.getTopProducts(startDate, endDate, limit));
    } catch (e) { next(e); }
};
const recordPayment = async (req, res, next) => {
    try {
        const { amount, paymentMethod } = req.body;
        if (!amount || !paymentMethod) return res.status(400).json({ success: false, message: 'amount and paymentMethod required.' });
        return success(res, 'Payment recorded.', await svc.recordPayment(req.params.id, amount, paymentMethod, req.user.id, req.ip));
    } catch (e) { next(e); }
};

module.exports = { list, getById, create, processReturn, todaySummary, summary, topProducts, recordPayment };
