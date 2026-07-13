'use strict';

const Joi = require('joi');

const checkIn = {
    body: Joi.object({
        employeeId: Joi.string().uuid().required(),
        notes: Joi.string().trim().max(500).allow('', null),
    }),
};

const checkOut = {
    body: Joi.object({
        employeeId: Joi.string().uuid().required(),
        notes: Joi.string().trim().max(500).allow('', null),
    }),
};

const markAttendance = {
    body: Joi.object({
        employeeId: Joi.string().uuid().required(),
        date: Joi.date().iso().required(),
        status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'LEAVE').required(),
        checkIn: Joi.date().iso().allow(null),
        checkOut: Joi.date().iso().allow(null),
        notes: Joi.string().trim().max(500).allow('', null),
    }),
};

const updateAttendance = {
    params: Joi.object({
        id: Joi.string().uuid().required(),
    }),
    body: Joi.object({
        status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'LEAVE'),
        checkIn: Joi.date().iso().allow(null),
        checkOut: Joi.date().iso().allow(null),
        notes: Joi.string().trim().max(500).allow('', null),
    }).min(1),
};

const listAttendance = {
    query: Joi.object({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        employeeId: Joi.string().uuid(),
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')),
        status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'LEAVE'),
        sortBy: Joi.string().valid('date', 'createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc'),
    }),
};

const getById = {
    params: Joi.object({
        id: Joi.string().uuid().required(),
    }),
};

module.exports = { checkIn, checkOut, markAttendance, updateAttendance, listAttendance, getById };
