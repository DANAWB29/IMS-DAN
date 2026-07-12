'use strict';

const prisma = require('../prisma');
const saleRepo = require('../repositories/sale.repository');
const stockRepo = require('../repositories/stock.repository');
const productRepo = require('../repositories/product.repository');
const { logActivity } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { paginate } = require('../utils/apiResponse');

// ── Helpers ────────────────────────────────────────────────

const generateInvoiceNumber = async () => {
    const last = await saleRepo.getLastInvoiceNumber();
    if (!last) return 'INV-000001';
    const num = parseInt(last.invoiceNumber.replace(/\D/g, ''), 10) + 1;
    return `INV-${String(num).padStart(6, '0')}`;
};

// ── List Sales ─────────────────────────────────────────────

const listSales = async (query) => {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, ['createdAt', 'total']);
    const where = {};
    if (query.customerId) where.customerId = query.customerId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) where.createdAt.gte = new Date(query.startDate);
        if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }
    const [sales, total] = await Promise.all([
        saleRepo.findAll({ skip, take: limit, where, orderBy: { [sortBy]: sortOrder } }),
        saleRepo.count(where),
    ]);
    return { sales, meta: paginate(total, page, limit) };
};

const getSaleById = async (id) => {
    const s = await saleRepo.findById(id);
    if (!s) throw new AppError('Sale not found.', 404);
    return s;
};

// ── Create Sale (POS) ──────────────────────────────────────

const createSale = async (data, userId, ipAddress) => {
    // Validate all items and check stock
    const resolvedItems = [];

    for (const item of data.items) {
        const product = await productRepo.findById(item.productId);
        if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);
        if (!product.isActive) throw new AppError(`Product is inactive: ${product.name}`, 400);

        const stockLevel = await stockRepo.getStockLevel(item.productId);
        const available = stockLevel._sum.remainingQty || 0;
        if (available < item.quantity) {
            throw new AppError(`Insufficient stock for "${product.name}". Available: ${available}, Requested: ${item.quantity}.`, 400);
        }

        resolvedItems.push({ ...item, product, available });
    }

    // Calculate totals
    const subtotal = resolvedItems.reduce((sum, i) => sum + (i.unitPrice * i.quantity) - (i.discount || 0), 0);
    const discount = Number(data.discount) || 0;
    const taxableAmount = subtotal - discount;
    const taxRate = data.taxRate ?? 15;
    const taxAmount = parseFloat(((taxableAmount * taxRate) / 100).toFixed(2));
    const total = parseFloat((taxableAmount + taxAmount).toFixed(2));
    const paidAmount = Number(data.paidAmount) || 0;

    let paymentStatus;
    if (paidAmount >= total) paymentStatus = 'PAID';
    else if (paidAmount > 0) paymentStatus = 'PARTIAL';
    else paymentStatus = 'UNPAID';

    const invoiceNumber = await generateInvoiceNumber();

    return prisma.$transaction(async (tx) => {
        // Create sale
        const sale = await tx.sale.create({
            data: {
                invoiceNumber,
                customerId: data.customerId || null,
                employeeId: data.employeeId,
                paymentMethod: data.paymentMethod,
                paymentStatus,
                subtotal,
                discount,
                tax: taxAmount,
                total,
                paidAmount,
                notes: data.notes || null,
                items: {
                    create: resolvedItems.map((i) => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        costPrice: Number(i.product.costPrice),
                        discount: i.discount || 0,
                        total: parseFloat(((i.unitPrice * i.quantity) - (i.discount || 0)).toFixed(2)),
                    })),
                },
            },
            include: {
                items: { include: { product: true } },
                customer: true,
                employee: true,
                payments: true,
            },
        });

        // Record payment if amount > 0
        if (paidAmount > 0) {
            await tx.payment.create({
                data: {
                    amount: paidAmount,
                    paymentMethod: data.paymentMethod,
                    saleId: sale.id,
                    customerId: data.customerId || null,
                },
            });
        }

        // Update customer credit balance if on credit
        if (data.customerId && paymentStatus !== 'PAID') {
            const outstanding = total - paidAmount;
            await tx.customer.update({
                where: { id: data.customerId },
                data: { creditBalance: { increment: outstanding } },
            });
        }

        // Deduct stock using FIFO for each item
        for (const item of resolvedItems) {
            const batches = await stockRepo.getFIFOBatches(item.productId);
            let remaining = item.quantity;

            for (const batch of batches) {
                if (remaining <= 0) break;
                const deduct = Math.min(batch.remainingQty, remaining);
                await tx.batch.update({ where: { id: batch.id }, data: { remainingQty: batch.remainingQty - deduct } });
                await tx.stockMovement.create({
                    data: {
                        type: 'SALE',
                        quantity: deduct,
                        reason: `Sale: ${invoiceNumber}`,
                        reference: invoiceNumber,
                        batchId: batch.id,
                        productId: item.productId,
                        employeeId: data.employeeId,
                    },
                });
                remaining -= deduct;
            }
        }

        await logActivity({
            action: 'CREATE_SALE', userId, tableName: 'sales', recordId: sale.id,
            description: `Sale created: ${invoiceNumber}, Total: ${total}`, ipAddress
        });

        return sale;
    });
};

// ── Process Return ─────────────────────────────────────────

const processReturn = async (saleId, data, userId, ipAddress) => {
    const originalSale = await saleRepo.findById(saleId);
    if (!originalSale) throw new AppError('Sale not found.', 404);
    if (originalSale.isReturn) throw new AppError('Cannot return a return sale.', 400);

    const invoiceNumber = await generateInvoiceNumber();
    let returnTotal = 0;

    return prisma.$transaction(async (tx) => {
        const returnItems = [];

        for (const ri of data.items) {
            const originalItem = originalSale.items.find((i) => i.id === ri.saleItemId);
            if (!originalItem) throw new AppError(`Sale item not found: ${ri.saleItemId}`, 404);
            if (ri.quantity > originalItem.quantity) {
                throw new AppError(`Return quantity (${ri.quantity}) exceeds original quantity (${originalItem.quantity}) for ${originalItem.product.name}.`, 400);
            }

            const itemTotal = parseFloat((originalItem.unitPrice * ri.quantity).toFixed(2));
            returnTotal += itemTotal;

            returnItems.push({
                productId: originalItem.productId,
                quantity: ri.quantity,
                unitPrice: originalItem.unitPrice,
                costPrice: Number(originalItem.costPrice),
                discount: 0,
                total: itemTotal,
            });

            // Re-stock using newest batch (LIFO for returns)
            const batches = await stockRepo.getFIFOBatches(originalItem.productId);
            const targetBatch = batches.length > 0 ? batches[batches.length - 1] : null;

            if (targetBatch) {
                await tx.batch.update({
                    where: { id: targetBatch.id },
                    data: { remainingQty: { increment: ri.quantity } }
                });
                await tx.stockMovement.create({
                    data: {
                        type: 'RETURN',
                        quantity: ri.quantity,
                        reason: `Return: ${ri.reason}. Original invoice: ${originalSale.invoiceNumber}`,
                        reference: originalSale.invoiceNumber,
                        batchId: targetBatch.id,
                        productId: originalItem.productId,
                        employeeId: data.employeeId || null,
                    }
                });
            }
        }

        // Create return sale record
        const returnSale = await tx.sale.create({
            data: {
                invoiceNumber,
                customerId: originalSale.customerId,
                employeeId: originalSale.employeeId,
                paymentMethod: originalSale.paymentMethod,
                paymentStatus: 'PAID',
                subtotal: returnTotal,
                discount: 0,
                tax: 0,
                total: returnTotal,
                paidAmount: returnTotal,
                isReturn: true,
                originalSaleId: saleId,
                notes: `Return of invoice ${originalSale.invoiceNumber}`,
                items: { create: returnItems },
            },
        });

        // Reduce customer credit if applicable
        if (originalSale.customerId) {
            await tx.customer.update({
                where: { id: originalSale.customerId },
                data: { creditBalance: { decrement: Math.min(returnTotal, Number((await tx.customer.findUnique({ where: { id: originalSale.customerId }, select: { creditBalance: true } })).creditBalance)) } }
            });
        }

        await logActivity({
            action: 'RETURN', userId, tableName: 'sales', recordId: returnSale.id,
            description: `Return processed for invoice ${originalSale.invoiceNumber}. Return total: ${returnTotal}`, ipAddress
        });

        return returnSale;
    });
};

// ── Record Additional Payment ──────────────────────────────

const recordPayment = async (saleId, amount, paymentMethod, userId, ipAddress) => {
    const sale = await saleRepo.findById(saleId);
    if (!sale) throw new AppError('Sale not found.', 404);
    if (sale.paymentStatus === 'PAID') throw new AppError('This sale is already fully paid.', 400);

    const newPaid = Number(sale.paidAmount) + Number(amount);
    if (newPaid > Number(sale.total)) {
        throw new AppError(`Overpayment not allowed. Outstanding: ${(Number(sale.total) - Number(sale.paidAmount)).toFixed(2)}`, 400);
    }

    const newStatus = newPaid >= Number(sale.total) ? 'PAID' : 'PARTIAL';

    await prisma.$transaction([
        prisma.sale.update({ where: { id: saleId }, data: { paidAmount: newPaid, paymentStatus: newStatus } }),
        prisma.payment.create({ data: { amount, paymentMethod, saleId, customerId: sale.customerId } }),
    ]);

    if (sale.customerId) {
        await prisma.customer.update({
            where: { id: sale.customerId },
            data: { creditBalance: { decrement: amount } }
        });
    }

    await logActivity({
        action: 'PAYMENT', userId, tableName: 'sales', recordId: saleId,
        description: `Payment of ${amount} recorded for invoice ${sale.invoiceNumber}`, ipAddress
    });

    return saleRepo.findById(saleId);
};

// ── Dashboard stats ────────────────────────────────────────

const getTodaySummary = () => saleRepo.getTodaySummary();

const getSalesSummary = (startDate, endDate) =>
    saleRepo.getSalesSummary(new Date(startDate), new Date(endDate));

const getTopProducts = (startDate, endDate, limit) =>
    saleRepo.getTopProducts(new Date(startDate), new Date(endDate), parseInt(limit, 10) || 10);

module.exports = {
    listSales, getSaleById, createSale, processReturn,
    recordPayment, getTodaySummary, getSalesSummary, getTopProducts,
};
