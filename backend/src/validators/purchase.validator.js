'use strict';
const Joi = require('joi');

const itemSchema = Joi.object({
    productId: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).required(),
    unitCost: Joi.number().positive().precision(2).required(),
    expiryDate: Joi.date().iso().allow(null),
    batchNumber: Joi.string().trim().max(100).allow('', null),
});

const create = {
    body: Joi.object({
        supplierId: Joi.string().uuid().required(),
        employeeId: Joi.string().uuid().allow(null),
        notes: Joi.string().trim().max(1000).allow('', null),
        items: Joi.array().items(itemSchema).min(1).required(),
    })
};

const receive = {
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body: Joi.object({ notes: Joi.string().trim().max(1000).allow('', null) }),
};

const pay = {
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body: Joi.object({
        amount: Joi.number().positive().precision(2).required(),
        paymentMethod: Joi.string().valid('CASH', 'CREDIT', 'BANK_TRANSFER', 'MOBILE_MONEY').required(),
        reference: Joi.string().trim().max(200).allow('', null),
        notes: Joi.string().trim().max(500).allow('', null),
    }),
};

const getById = { params: Joi.object({ id: Joi.string().uuid().required() }) };

const list = {
    query: Joi.object({
        page: Joi.number().integer().min(1), limit: Joi.number().integer().min(1).max(100),
        supplierId: Joi.string().uuid(), status: Joi.string().valid('PENDING', 'RECEIVED', 'PARTIAL', 'CANCELLED'),
        startDate: Joi.date().iso(), endDate: Joi.date().iso(),
        sortBy: Joi.string().valid('createdAt', 'totalAmount'), sortOrder: Joi.string().valid('asc', 'desc'),
    })
};

module.exports = { create, receive, pay, getById, list };
