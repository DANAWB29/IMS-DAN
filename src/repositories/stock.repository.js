'use strict';
const prisma = require('../prisma');

// Batches
const createBatch = (data) => prisma.batch.create({
    data,
    include: { product: true, supplier: true }
});

const findBatchById = (id) => prisma.batch.findUnique({
    where: { id, isDeleted: false },
    include: { product: true, supplier: true }
});

const findBatchByNumber = (batchNumber) =>
    prisma.batch.findUnique({ where: { batchNumber } });

// FIFO: get batches for a product ordered oldest first with remaining stock
const getFIFOBatches = (productId) =>
    prisma.batch.findMany({
        where: { productId, isDeleted: false, remainingQty: { gt: 0 } },
        orderBy: { createdAt: 'asc' },
    });

const updateBatch = (id, data) => prisma.batch.update({ where: { id }, data });

const getBatchesByProduct = (productId) =>
    prisma.batch.findMany({ where: { productId, isDeleted: false }, orderBy: { createdAt: 'asc' } });

// Stock Movements
const createMovement = (data) => prisma.stockMovement.create({
    data,
    include: { product: true, batch: true, employee: true }
});

const findAllMovements = ({ skip, take, where, orderBy }) =>
    prisma.stockMovement.findMany({
        where: { isDeleted: false, ...where }, skip, take, orderBy,
        include: {
            product: { select: { id: true, name: true, sku: true } },
            batch: { select: { id: true, batchNumber: true } },
            employee: { select: { id: true, firstName: true, lastName: true } }
        }
    });

const countMovements = (where = {}) =>
    prisma.stockMovement.count({ where: { isDeleted: false, ...where } });

// Current stock level per product
const getStockLevel = (productId) =>
    prisma.batch.aggregate({ where: { productId, isDeleted: false }, _sum: { remainingQty: true } });

// Expiring products
const getExpiringBatches = (daysAhead = 30) => {
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);
    return prisma.batch.findMany({
        where: { isDeleted: false, remainingQty: { gt: 0 }, expiryDate: { lte: future, gte: new Date() } },
        include: {
            product: { select: { id: true, name: true, sku: true, minimumStock: true } },
            supplier: { select: { id: true, name: true } }
        },
        orderBy: { expiryDate: 'asc' },
    });
};

module.exports = {
    createBatch, findBatchById, findBatchByNumber, getFIFOBatches,
    updateBatch, getBatchesByProduct, createMovement,
    findAllMovements, countMovements, getStockLevel, getExpiringBatches,
};
