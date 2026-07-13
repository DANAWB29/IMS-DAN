'use strict';
const Joi = require('joi');

const saleItemSchema = Joi.object({
    productId: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).required(),
    unitPrice: Joi.number().positive().precision(2).required(),
    discount: Joi.number().min(0).precision(2).default(0),
});

const create = {
    body: Joi.object({
        customerId: Joi.string().uuid().allow(null),
        employeeId: Joi.string().uuid().required(),
        paymentMethod: Joi.string().valid('CASH', 'CREDIT', 'BANK_TRANSFER', 'MOBILE_MONEY').required(),
        discount: Joi.number().min(0).precision(2).default(0),
        taxRate: Joi.number().min(0).max(100).default(15),
        paidAmount: Joi.number().min(0).precision(2).default(0),
        notes: Joi.string().trim().max(1000).allow('', null),
        items: Joi.array().items(saleItemSchema).min(1).required(),
    })
};

const processReturn = {
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body: Joi.object({
        items: Joi.array().items(Joi.object({
            saleItemId: Joi.string().uuid().required(),
            quantity: Joi.number().integer().min(1).required(),
            reason: Joi.string().trim().max(500).required(),
        })).min(1).required(),
    }),
};

const getById = { params: Joi.object({ id: Joi.string().uuid().required() }) };

const list = {
    query: Joi.object({
        page: Joi.number().integer().min(1), limit: Joi.number().integer().min(1).max(100),
        customerId: Joi.string().uuid(), employeeId: Joi.string().uuid(),
        paymentStatus: Joi.string().valid('PAID', 'UNPAID', 'PARTIAL'),
        startDate: Joi.date().iso(), endDate: Joi.date().iso(),
        sortBy: Joi.string().valid('createdAt', 'total'), sortOrder: Joi.string().valid('asc', 'desc'),
    })
};

module.exports = { create, processReturn, getById, list };
