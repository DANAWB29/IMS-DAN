'use strict';

const prisma = require('../prisma');
const repo = require('../repositories/purchase.repository');
const stockRepo = require('../repositories/stock.repository');
const productRepo = require('../repositories/product.repository');
const supplierRepo = require('../repositories/supplier.repository');
const { logActivity } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { paginate } = require('../utils/apiResponse');

const generatePurchaseNumber = async () => {
    const last = await repo.getLastPurchaseNumber();
    if (!last) return 'PO-000001';
    const num = parseInt(last.purchaseNumber.split('-')[1], 10) + 1;
    return `PO-${String(num).padStart(6, '0')}`;
};

const generateBatchNum = async (productId) => {
    const prefix = 'BTC';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let suffix = 1;
    let batchNumber;
    let exists = true;
    while (exists && suffix < 9999) {
        batchNumber = `${prefix}-${productId.slice(0, 4).toUpperCase()}-${date}-${String(suffix).padStart(3, '0')}`;
        const found = await stockRepo.findBatchByNumber(batchNumber);
        exists = !!found;
        suffix++;
    }
    return batchNumber;
};

const listPurchases = async (query) => {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, ['createdAt', 'totalAmount']);
    const where = {};
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) where.createdAt.gte = new Date(query.startDate);
        if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }
    const [purchases, total] = await Promise.all([
        repo.findAll({ skip, take: limit, where, orderBy: { [sortBy]: sortOrder } }),
        repo.count(where),
    ]);
    return { purchases, meta: paginate(total, page, limit) };
};

const getPurchaseById = async (id) => {
    const p = await repo.findById(id);
    if (!p) throw new AppError('Purchase not found.', 404);
    return p;
};

const createPurchase = async (data, userId, ipAddress) => {
    const supplier = await supplierRepo.findById(data.supplierId);
    if (!supplier) throw new AppError('Supplier not found.', 404);

    // Validate all products exist
    for (const item of data.items) {
        const product = await productRepo.findById(item.productId);
        if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);
    }

    const purchaseNumber = await generatePurchaseNumber();
    const totalAmount = data.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

    const purchase = await repo.create({
        purchaseNumber,
        supplierId: data.supplierId,
        employeeId: data.employeeId || null,
        status: 'PENDING',
        totalAmount,
        notes: data.notes || null,
        items: {
            create: data.items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                unitCost: i.unitCost,
                totalCost: i.quantity * i.unitCost,
            })),
        },
    });

    await logActivity({
        action: 'CREATE', userId, tableName: 'purchases', recordId: purchase.id,
        description: `Purchase order created: ${purchaseNumber} from ${supplier.name}`, newValues: data, ipAddress
    });

    return purchase;
};

const receivePurchase = async (id, data, userId, ipAddress) => {
    const purchase = await repo.findById(id);
    if (!purchase) throw new AppError('Purchase not found.', 404);
    if (purchase.status === 'RECEIVED') throw new AppError('Purchase already received.', 409);
    if (purchase.status === 'CANCELLED') throw new AppError('Cannot receive a cancelled purchase.', 400);

    await prisma.$transaction(async (tx) => {
        for (const item of purchase.items) {
            const batchNumber = item.batchId
                ? (await stockRepo.findBatchById(item.batchId))?.batchNumber
                : await generateBatchNum(item.productId);

            const batch = await tx.batch.create({
                data: {
                    batchNumber,
                    quantity: item.quantity,
                    remainingQty: item.quantity,
                    buyingPrice: item.unitCost,
                    expiryDate: null,
                    productId: item.productId,
                    supplierId: purchase.supplierId,
                },
            });

            await tx.purchaseItem.update({ where: { id: item.id }, data: { batchId: batch.id } });

            await tx.stockMovement.create({
                data: {
                    type: 'STOCK_IN',
                    quantity: item.quantity,
                    reason: `Purchase received: ${purchase.purchaseNumber}`,
                    reference: purchase.purchaseNumber,
                    batchId: batch.id,
                    productId: item.productId,
                },
            });
        }

        await tx.purchase.update({
            where: { id },
            data: {
                status: 'RECEIVED',
                receivedAt: new Date(),
                notes: data.notes || purchase.notes,
            },
        });
    });

    await logActivity({
        action: 'RECEIVE', userId, tableName: 'purchases', recordId: id,
        description: `Purchase received: ${purchase.purchaseNumber}`, ipAddress,
    });

    // Fetch after transaction is committed so status is correct
    return repo.findById(id);
};

const cancelPurchase = async (id, userId, ipAddress) => {
    const purchase = await repo.findById(id);
    if (!purchase) throw new AppError('Purchase not found.', 404);
    if (purchase.status === 'RECEIVED') throw new AppError('Cannot cancel a received purchase.', 409);
    if (purchase.status === 'CANCELLED') throw new AppError('Purchase is already cancelled.', 409);

    const updated = await repo.update(id, { status: 'CANCELLED' });
    await logActivity({
        action: 'CANCEL', userId, tableName: 'purchases', recordId: id,
        description: `Purchase cancelled: ${purchase.purchaseNumber}`, ipAddress
    });
    return updated;
};

const payPurchase = async (id, paymentData, userId, ipAddress) => {
    const purchase = await repo.findById(id);
    if (!purchase) throw new AppError('Purchase not found.', 404);
    if (purchase.status === 'CANCELLED') throw new AppError('Cannot pay for a cancelled purchase.', 400);

    const totalPaid = Number(purchase.paidAmount) + Number(paymentData.amount);
    const totalAmount = Number(purchase.totalAmount);

    if (totalPaid > totalAmount) {
        throw new AppError(`Overpayment not allowed. Outstanding balance: ${(totalAmount - Number(purchase.paidAmount)).toFixed(2)}`, 400);
    }

    const newStatus = totalPaid >= totalAmount ? 'RECEIVED' : purchase.status;

    await prisma.$transaction([
        prisma.purchase.update({ where: { id }, data: { paidAmount: totalPaid, status: newStatus } }),
        prisma.payment.create({
            data: {
                amount: paymentData.amount,
                paymentMethod: paymentData.paymentMethod,
                reference: paymentData.reference || null,
                notes: paymentData.notes || null,
                purchaseId: id,
            }
        }),
    ]);

    await logActivity({
        action: 'PAYMENT', userId, tableName: 'purchases', recordId: id,
        description: `Payment of ${paymentData.amount} recorded for purchase ${purchase.purchaseNumber}`, ipAddress
    });

    return repo.findById(id);
};

module.exports = { listPurchases, getPurchaseById, createPurchase, receivePurchase, cancelPurchase, payPurchase };
