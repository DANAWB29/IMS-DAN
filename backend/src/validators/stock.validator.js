'use strict';
const Joi = require('joi');

const stockIn = {
    body: Joi.object({
        productId: Joi.string().uuid().required(),
        supplierId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
        buyingPrice: Joi.number().positive().precision(2).required(),
        batchNumber: Joi.string().trim().max(100).allow('', null),
        expiryDate: Joi.date().iso().allow(null),
        reason: Joi.string().trim().max(500).allow('', null),
        warehouseId: Joi.string().uuid().allow(null),
    })
};

const stockOut = {
    body: Joi.object({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
        reason: Joi.string().trim().max(500).required(),
        warehouseId: Joi.string().uuid().allow(null),
    })
};

const adjustment = {
    body: Joi.object({
        productId: Joi.string().uuid().required(),
        newQuantity: Joi.number().integer().min(0).required(),
        reason: Joi.string().trim().max(500).required(),
        batchId: Joi.string().uuid().required(),
    })
};

const transfer = {
    body: Joi.object({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
        fromWarehouseId: Joi.string().uuid().required(),
        toWarehouseId: Joi.string().uuid().required(),
        reason: Joi.string().trim().max(500).allow('', null),
    })
};

const listMovements = {
    query: Joi.object({
        page: Joi.number().integer().min(1), limit: Joi.number().integer().min(1).max(100),
        productId: Joi.string().uuid(), type: Joi.string().valid('STOCK_IN', 'STOCK_OUT', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER'),
        startDate: Joi.date().iso(), endDate: Joi.date().iso(),
        sortBy: Joi.string().valid('createdAt'), sortOrder: Joi.string().valid('asc', 'desc'),
    })
};

module.exports = { stockIn, stockOut, adjustment, transfer, listMovements };
