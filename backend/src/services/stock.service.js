'use strict';

const prisma = require('../prisma');
const stockRepo = require('../repositories/stock.repository');
const productRepo = require('../repositories/product.repository');
const { logActivity } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { paginate } = require('../utils/apiResponse');

// ── Helpers ────────────────────────────────────────────────

const generateBatchNumber = async () => {
    const prefix = 'BTC';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let suffix = 1;
    let batchNumber;
    let exists = true;
    while (exists && suffix < 9999) {
        batchNumber = `${prefix}-${date}-${String(suffix).padStart(4, '0')}`;
        const found = await stockRepo.findBatchByNumber(batchNumber);
        exists = !!found;
        suffix++;
    }
    return batchNumber;
};

// ── Stock In (manual, not via purchase) ────────────────────

const stockIn = async (data, userId, ipAddress) => {
    const product = await productRepo.findById(data.productId);
    if (!product) throw new AppError('Product not found.', 404);

    const batchNumber = data.batchNumber || await generateBatchNumber();
    const existing = await stockRepo.findBatchByNumber(batchNumber);
    if (existing) throw new AppError('Batch number already exists.', 409);

    return prisma.$transaction(async (tx) => {
        const batch = await tx.batch.create({
            data: {
                batchNumber,
                quantity: data.quantity,
                remainingQty: data.quantity,
                buyingPrice: data.buyingPrice,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                productId: data.productId,
                supplierId: data.supplierId,
            },
        });

        await tx.stockMovement.create({
            data: {
                type: 'STOCK_IN',
                quantity: data.quantity,
                reason: data.reason || 'Manual stock in',
                batchId: batch.id,
                productId: data.productId,
                employeeId: userId ? null : null, // Employee ID if from employee
                warehouseId: data.warehouseId || null,
                reference: batchNumber,
            },
        });

        await logActivity({
            action: 'STOCK_IN', userId, tableName: 'batches', recordId: batch.id,
            description: `Stock in: ${data.quantity} units of ${product.name} [Batch: ${batchNumber}]`,
            newValues: data, ipAddress
        });

        return batch;
    });
};

// ── Stock Out (FIFO) ────────────────────────────────────────

const stockOut = async (data, userId, ipAddress) => {
    const product = await productRepo.findById(data.productId);
    if (!product) throw new AppError('Product not found.', 404);

    const currentStock = await stockRepo.getStockLevel(data.productId);
    const available = currentStock._sum.remainingQty || 0;
    if (available < data.quantity) {
        throw new AppError(`Insufficient stock. Available: ${available}, Requested: ${data.quantity}.`, 400);
    }

    return prisma.$transaction(async (tx) => {
        const batches = await stockRepo.getFIFOBatches(data.productId);
        let remaining = data.quantity;
        const movements = [];

        for (const batch of batches) {
            if (remaining <= 0) break;
            const deduct = Math.min(batch.remainingQty, remaining);
            await tx.batch.update({ where: { id: batch.id }, data: { remainingQty: batch.remainingQty - deduct } });
            const movement = await tx.stockMovement.create({
                data: {
                    type: 'STOCK_OUT',
                    quantity: deduct,
                    reason: data.reason,
                    batchId: batch.id,
                    productId: data.productId,
                    warehouseId: data.warehouseId || null,
                },
            });
            movements.push(movement);
            remaining -= deduct;
        }

        await logActivity({
            action: 'STOCK_OUT', userId, tableName: 'stock_movements', recordId: data.productId,
            description: `Stock out: ${data.quantity} units of ${product.name}. Reason: ${data.reason}`,
            newValues: data, ipAddress
        });

        return movements;
    });
};

// ── Stock Adjustment ────────────────────────────────────────

const adjustment = async (data, userId, ipAddress) => {
    const batch = await stockRepo.findBatchById(data.batchId);
    if (!batch) throw new AppError('Batch not found.', 404);

    const diff = data.newQuantity - batch.remainingQty;
    const type = diff >= 0 ? 'STOCK_IN' : 'STOCK_OUT';
    const qty = Math.abs(diff);

    if (qty === 0) throw new AppError('No change in quantity.', 400);

    return prisma.$transaction(async (tx) => {
        await tx.batch.update({ where: { id: data.batchId }, data: { remainingQty: data.newQuantity } });

        const movement = await tx.stockMovement.create({
            data: {
                type: 'ADJUSTMENT',
                quantity: qty,
                reason: data.reason,
                batchId: data.batchId,
                productId: batch.productId,
            },
        });

        await logActivity({
            action: 'ADJUSTMENT', userId, tableName: 'batches', recordId: data.batchId,
            description: `Stock adjusted for ${batch.product.name}: ${batch.remainingQty} → ${data.newQuantity}. ${data.reason}`,
            oldValues: { remainingQty: batch.remainingQty }, newValues: { remainingQty: data.newQuantity }, ipAddress
        });

        return movement;
    });
};

// ── Get Movements ────────────────────────────────────────────

const listMovements = async (query) => {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, ['createdAt']);
    const where = {};
    if (query.productId) where.productId = query.productId;
    if (query.type) where.type = query.type;
    if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) where.createdAt.gte = new Date(query.startDate);
        if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [movements, total] = await Promise.all([
        stockRepo.findAllMovements({ skip, take: limit, where, orderBy: { [sortBy]: sortOrder } }),
        stockRepo.countMovements(where),
    ]);
    return { movements, meta: paginate(total, page, limit) };
};

const getBatchesByProduct = async (productId) => {
    const product = await productRepo.findById(productId);
    if (!product) throw new AppError('Product not found.', 404);
    const batches = await stockRepo.getBatchesByProduct(productId);
    return batches;
};

const getExpiringProducts = async (daysAhead = 30) => {
    return stockRepo.getExpiringBatches(parseInt(daysAhead, 10) || 30);
};

module.exports = { stockIn, stockOut, adjustment, listMovements, getBatchesByProduct, getExpiringProducts };
