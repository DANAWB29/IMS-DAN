'use strict';
const prisma = require('../prisma');

const saleInclude = {
    customer: { select: { id: true, name: true, phone: true } },
    employee: { select: { id: true, firstName: true, lastName: true } },
    items: {
        where: { isDeleted: false },
        include: { product: { select: { id: true, name: true, sku: true, unit: true } } },
    },
    payments: true,
};

const findAll = ({ skip, take, where, orderBy }) =>
    prisma.sale.findMany({ where: { isDeleted: false, ...where }, include: saleInclude, skip, take, orderBy });

const count = (where = {}) => prisma.sale.count({ where: { isDeleted: false, ...where } });

const findById = (id) => prisma.sale.findUnique({ where: { id, isDeleted: false }, include: saleInclude });

const findByInvoice = (invoiceNumber) =>
    prisma.sale.findUnique({ where: { invoiceNumber }, include: saleInclude });

const create = (data) => prisma.sale.create({ data, include: saleInclude });

const update = (id, data) => prisma.sale.update({ where: { id }, data, include: saleInclude });

const getLastInvoiceNumber = () =>
    prisma.sale.findFirst({ orderBy: { createdAt: 'desc' }, select: { invoiceNumber: true } });

// Today's sales summary
const getTodaySummary = () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return prisma.sale.aggregate({
        where: { isDeleted: false, isReturn: false, createdAt: { gte: start, lte: end } },
        _sum: { total: true, discount: true, tax: true },
        _count: { id: true },
    });
};

// Sales summary for a date range
const getSalesSummary = (startDate, endDate) =>
    prisma.sale.aggregate({
        where: { isDeleted: false, isReturn: false, createdAt: { gte: startDate, lte: endDate } },
        _sum: { total: true, discount: true, tax: true, paidAmount: true },
        _count: { id: true },
    });

// Top selling products
const getTopProducts = (startDate, endDate, limit = 10) =>
    prisma.$queryRaw`
    SELECT p.id, p.name, p.sku,
           SUM(si.quantity)::int AS "totalSold",
           SUM(si.total)::float AS "totalRevenue",
           SUM(si.quantity * si."costPrice")::float AS "totalCost",
           (SUM(si.total) - SUM(si.quantity * si."costPrice"))::float AS "totalProfit"
    FROM sale_items si
    JOIN products p ON p.id = si."productId"
    JOIN sales s ON s.id = si."saleId"
    WHERE s."isDeleted" = false AND s."isReturn" = false
      AND s."createdAt" >= ${startDate} AND s."createdAt" <= ${endDate}
      AND si."isDeleted" = false
    GROUP BY p.id, p.name, p.sku
    ORDER BY "totalSold" DESC
    LIMIT ${limit}
  `;

module.exports = {
    findAll, count, findById, findByInvoice, create, update,
    getLastInvoiceNumber, getTodaySummary, getSalesSummary, getTopProducts,
};
