'use strict';
const Joi = require('joi');

const create = {
    body: Joi.object({
        name: Joi.string().trim().min(2).max(200).required(),
        phone: Joi.string().trim().max(20).allow('', null),
        email: Joi.string().trim().email().lowercase().allow('', null),
        address: Joi.string().trim().max(500).allow('', null),
        contactPerson: Joi.string().trim().max(100).allow('', null),
    })
};

const update = {
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body: Joi.object({
        name: Joi.string().trim().min(2).max(200),
        phone: Joi.string().trim().max(20).allow('', null),
        email: Joi.string().trim().email().lowercase().allow('', null),
        address: Joi.string().trim().max(500).allow('', null),
        contactPerson: Joi.string().trim().max(100).allow('', null),
        isActive: Joi.boolean(),
    }).min(1),
};

const getById = { params: Joi.object({ id: Joi.string().uuid().required() }) };

const list = {
    query: Joi.object({
        page: Joi.number().integer().min(1), limit: Joi.number().integer().min(1).max(100),
        search: Joi.string().trim().max(100).allow(''), isActive: Joi.boolean(),
        sortBy: Joi.string().valid('name', 'createdAt'), sortOrder: Joi.string().valid('asc', 'desc'),
    })
};

module.exports = { create, update, getById, list };
