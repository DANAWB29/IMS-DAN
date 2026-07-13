'use strict';
const Joi = require('joi');

const createCategory = {
    body: Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        description: Joi.string().trim().max(500).allow('', null),
    })
};

const createExpense = {
    body: Joi.object({
        title: Joi.string().trim().min(2).max(200).required(),
        amount: Joi.number().positive().precision(2).required(),
        description: Joi.string().trim().max(1000).allow('', null),
        categoryId: Joi.string().uuid().required(),
        expenseDate: Joi.date().iso().required(),
        status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'PAID').default('PENDING'),
    })
};

const updateExpense = {
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body: Joi.object({
        title: Joi.string().trim().min(2).max(200),
        amount: Joi.number().positive().precision(2),
        description: Joi.string().trim().max(1000).allow('', null),
        categoryId: Joi.string().uuid(),
        expenseDate: Joi.date().iso(),
        status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'PAID'),
    }).min(1),
};

const getById = { params: Joi.object({ id: Joi.string().uuid().required() }) };

const list = {
    query: Joi.object({
        page: Joi.number().integer().min(1), limit: Joi.number().integer().min(1).max(100),
        categoryId: Joi.string().uuid(), status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'PAID'),
        startDate: Joi.date().iso(), endDate: Joi.date().iso(),
        sortBy: Joi.string().valid('expenseDate', 'createdAt', 'amount'), sortOrder: Joi.string().valid('asc', 'desc'),
    })
};

module.exports = { createCategory, createExpense, updateExpense, getById, list };
