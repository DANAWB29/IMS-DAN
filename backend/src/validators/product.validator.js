'use strict';

const Joi = require('joi');

const create = {
    body: Joi.object({
        name: Joi.string().trim().min(2).max(200).required(),
        description: Joi.string().trim().max(1000).allow('', null),
        sellingPrice: Joi.number().positive().precision(2).required(),
        costPrice: Joi.number().positive().precision(2).required(),
        minimumStock: Joi.number().integer().min(0).default(10),
        unit: Joi.string().trim().max(50).required(),
        categoryId: Joi.string().uuid().required(),
        barcode: Joi.string().trim().max(50).allow('', null),
        sku: Joi.string().trim().max(50).allow('', null),
        isActive: Joi.boolean().default(true),
    }),
};

const update = {
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body: Joi.object({
        name: Joi.string().trim().min(2).max(200),
        description: Joi.string().trim().max(1000).allow('', null),
        sellingPrice: Joi.number().positive().precision(2),
        costPrice: Joi.number().positive().precision(2),
        minimumStock: Joi.number().integer().min(0),
        unit: Joi.string().trim().max(50),
        categoryId: Joi.string().uuid(),
        barcode: Joi.string().trim().max(50).allow('', null),
        isActive: Joi.boolean(),
    }).min(1),
};

const getById = {
    params: Joi.object({ id: Joi.string().uuid().required() }),
};

const list = {
    query: Joi.object({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        search: Joi.string().trim().max(200).allow(''),
        categoryId: Joi.string().uuid(),
        isActive: Joi.boolean(),
        lowStock: Joi.boolean(),
        minPrice: Joi.number().min(0),
        maxPrice: Joi.number().min(0),
        sortBy: Joi.string().valid('name', 'createdAt', 'sellingPrice', 'costPrice'),
        sortOrder: Joi.string().valid('asc', 'desc'),
    }),
};

module.exports = { create, update, getById, list };
