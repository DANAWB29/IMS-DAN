'use strict';
const prisma = require('../prisma');

const purchaseInclude = {
    supplier: true,
    employee: { select: { id: true, firstName: true, lastName: true } },
    items: {
        include: {
            product: { select: { id: true, name: true, sku: true } },
            batch: { select: { id: true, batchNumber: true } }
        }
    },
    payments: true,
};

const findAll = ({ skip, take, where, orderBy }) =>
    prisma.purchase.findMany({ where: { isDeleted: false, ...where }, include: purchaseInclude, skip, take, orderBy });

const count = (where = {}) => prisma.purchase.count({ where: { isDeleted: false, ...where } });

const findById = (id) => prisma.purchase.findUnique({ where: { id, isDeleted: false }, include: purchaseInclude });

const findByNumber = (purchaseNumber) =>
    prisma.purchase.findUnique({ where: { purchaseNumber }, include: purchaseInclude });

const create = (data) => prisma.purchase.create({ data, include: purchaseInclude });

const update = (id, data) => prisma.purchase.update({ where: { id }, data, include: purchaseInclude });

const addPayment = (data) => prisma.payment.create({ data });

const getSupplierPurchaseHistory = (supplierId, skip, take) =>
    prisma.purchase.findMany({
        where: { supplierId, isDeleted: false }, include: purchaseInclude,
        skip, take, orderBy: { createdAt: 'desc' }
    });

const countSupplierPurchases = (supplierId) =>
    prisma.purchase.count({ where: { supplierId, isDeleted: false } });

// Generate next purchase number
const getLastPurchaseNumber = () =>
    prisma.purchase.findFirst({ orderBy: { createdAt: 'desc' }, select: { purchaseNumber: true } });

module.exports = {
    findAll, count, findById, findByNumber, create, update,
    addPayment, getSupplierPurchaseHistory, countSupplierPurchases, getLastPurchaseNumber,
};
