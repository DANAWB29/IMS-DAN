'use strict';
const prisma = require('../prisma');

const findAll = ({ skip, take, where, orderBy }) =>
    prisma.supplier.findMany({
        where: { isDeleted: false, ...where }, skip, take, orderBy,
        include: { _count: { select: { purchases: true, batches: true } } }
    });

const count = (where = {}) => prisma.supplier.count({ where: { isDeleted: false, ...where } });
const findById = (id) => prisma.supplier.findUnique({
    where: { id, isDeleted: false },
    include: { _count: { select: { purchases: true, batches: true } } }
});
const findByName = (name) => prisma.supplier.findUnique({ where: { name, isDeleted: false } });
const findByEmail = (email) => prisma.supplier.findUnique({ where: { email, isDeleted: false } });
const create = (data) => prisma.supplier.create({ data });
const update = (id, data) => prisma.supplier.update({ where: { id }, data });
const softDelete = (id) => prisma.supplier.update({ where: { id }, data: { isDeleted: true } });

module.exports = { findAll, count, findById, findByName, findByEmail, create, update, softDelete };
