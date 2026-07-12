'use strict';

const prisma = require('../prisma');

const findAll = ({ skip, take, where, orderBy }) =>
    prisma.category.findMany({
        where: { isDeleted: false, ...where },
        include: { _count: { select: { products: true } } },
        skip, take, orderBy,
    });

const count = (where = {}) =>
    prisma.category.count({ where: { isDeleted: false, ...where } });

const findById = (id) =>
    prisma.category.findUnique({
        where: { id, isDeleted: false },
        include: { _count: { select: { products: true } } },
    });

const findByName = (name) =>
    prisma.category.findUnique({ where: { name, isDeleted: false } });

const create = (data) =>
    prisma.category.create({
        data,
        include: { _count: { select: { products: true } } },
    });

const update = (id, data) =>
    prisma.category.update({
        where: { id },
        data,
        include: { _count: { select: { products: true } } },
    });

const softDelete = (id) =>
    prisma.category.update({ where: { id }, data: { isDeleted: true } });

module.exports = { findAll, count, findById, findByName, create, update, softDelete };
