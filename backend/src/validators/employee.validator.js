'use strict';

const Joi = require('joi');

const createEmployee = {
    body: Joi.object({
        firstName: Joi.string().trim().min(2).max(100).required(),
        lastName: Joi.string().trim().min(2).max(100).required(),
        phone: Joi.string().trim().max(20).optional().allow('', null),
        email: Joi.string().trim().email().lowercase().max(255).optional().allow('', null),
        address: Joi.string().trim().max(500).optional().allow('', null),
        salary: Joi.number().positive().precision(2).required(),
        hireDate: Joi.date().iso().required(),
        position: Joi.string().trim().max(100).optional().allow('', null),
        department: Joi.string().trim().max(100).optional().allow('', null),
        branchId: Joi.string().uuid().optional().allow('', null),
    }),
};

const updateEmployee = {
    params: Joi.object({
        id: Joi.string().uuid().required(),
    }),
    body: Joi.object({
        firstName: Joi.string().trim().min(2).max(100),
        lastName: Joi.string().trim().min(2).max(100),
        phone: Joi.string().trim().max(20).allow('', null),
        email: Joi.string().trim().email().lowercase().max(255).allow('', null),
        address: Joi.string().trim().max(500).allow('', null),
        salary: Joi.number().positive().precision(2),
        hireDate: Joi.date().iso(),
        position: Joi.string().trim().max(100).allow('', null),
        department: Joi.string().trim().max(100).allow('', null),
        branchId: Joi.string().uuid().allow('', null),
        isActive: Joi.boolean(),
    }).min(1),
};

const getById = {
    params: Joi.object({
        id: Joi.string().uuid().required(),
    }),
};

const listEmployees = {
    query: Joi.object({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        search: Joi.string().trim().max(100).allow(''),
        isActive: Joi.boolean(),
        branchId: Joi.string().uuid(),
        department: Joi.string().trim().max(100),
        sortBy: Joi.string().valid('firstName', 'lastName', 'createdAt', 'salary', 'hireDate'),
        sortOrder: Joi.string().valid('asc', 'desc'),
    }),
};

module.exports = { createEmployee, updateEmployee, getById, listEmployees };
