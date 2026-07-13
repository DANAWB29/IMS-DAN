'use strict';

const Joi = require('joi');

const listUsers = {
    query: Joi.object({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        search: Joi.string().trim().max(100).allow(''),
        role: Joi.string().valid('ADMIN', 'STORE'),
        isActive: Joi.boolean(),
        sortBy: Joi.string().valid('fullName', 'email', 'createdAt', 'lastLogin'),
        sortOrder: Joi.string().valid('asc', 'desc'),
    }),
};

const getById = {
    params: Joi.object({
        id: Joi.string().uuid().required(),
    }),
};

const updateUser = {
    params: Joi.object({
        id: Joi.string().uuid().required(),
    }),
    body: Joi.object({
        fullName: Joi.string().trim().min(3).max(100),
        isActive: Joi.boolean(),
        role: Joi.string().valid('ADMIN', 'STORE'),
    }).min(1),
};

const deleteUser = {
    params: Joi.object({
        id: Joi.string().uuid().required(),
    }),
};

module.exports = { listUsers, getById, updateUser, deleteUser };
