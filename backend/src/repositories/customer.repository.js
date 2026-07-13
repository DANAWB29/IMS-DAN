'use strict';
const prisma = require('../prisma');

const findAll = ({ skip, take, where, orderBy }) =>
    prisma.customer.findMany({
        where: { isDeleted: false, ...where }, skip, take, orderBy,
        include: { _count: { select: { sales: true } } }
    });

const count = (where = {}) => prisma.customer.count({ where: { isDeleted: false, ...where } });
const findById = (id) => prisma.customer.findUnique({
    where: { id, isDeleted: false },
    include: { _count: { select: { sales: true } } }
});
const findByPhone = (phone) => prisma.customer.findUnique({ where: { phone, isDeleted: false } });
const create = (data) => prisma.customer.create({ data });
const update = (id, data) => prisma.customer.update({ where: { id }, data });
const softDelete = (id) => prisma.customer.update({ where: { id }, data: { isDeleted: true } });

const getCustomerSales = (customerId, skip, take) =>
    prisma.sale.findMany({
        where: { customerId, isDeleted: false }, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: { select: { id: true, name: true, sku: true } } } } }
    });

module.exports = { findAll, count, findById, findByPhone, create, update, softDelete, getCustomerSales };
