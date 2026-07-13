'use strict';
const prisma = require('../prisma');

const getDashboardStats = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [
        totalProducts, totalCategories, totalSuppliers, totalCustomers, totalEmployees,
        todaySales, monthSales, totalInventoryValue, lowStockCount, expiringCount,
        recentSales, recentActivities,
    ] = await Promise.all([
        prisma.product.count({ where: { isDeleted: false, isActive: true } }),
        prisma.category.count({ where: { isDeleted: false } }),
        prisma.supplier.count({ where: { isDeleted: false } }),
        prisma.customer.count({ where: { isDeleted: false } }),
        prisma.employee.count({ where: { isDeleted: false, isActive: true } }),

        prisma.sale.aggregate({
            where: { isDeleted: false, isReturn: false, createdAt: { gte: today, lte: todayEnd } },
            _sum: { total: true }, _count: { id: true }
        }),

        prisma.sale.aggregate({
            where: {
                isDeleted: false, isReturn: false,
                createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
            },
            _sum: { total: true }, _count: { id: true }
        }),

        prisma.$queryRaw`SELECT COALESCE(SUM(b."remainingQty" * b."buyingPrice"), 0)::float AS value
      FROM batches b WHERE b."isDeleted" = false`,

        prisma.$queryRaw`SELECT COUNT(*)::int FROM (
      SELECT p.id FROM products p LEFT JOIN batches b ON b."productId" = p.id AND b."isDeleted" = false
      WHERE p."isDeleted" = false AND p."isActive" = true
      GROUP BY p.id, p."minimumStock"
      HAVING COALESCE(SUM(b."remainingQty"), 0) < p."minimumStock"
    ) sub`,

        prisma.batch.count({
            where: {
                isDeleted: false, remainingQty: { gt: 0 },
                expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() }
            }
        }),

        prisma.sale.findMany({
            where: { isDeleted: false, isReturn: false }, take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { id: true, name: true } },
                employee: { select: { id: true, firstName: true, lastName: true } },
                items: { select: { id: true, quantity: true, total: true } }
            }
        }),

        prisma.activityLog.findMany({
            take: 15, orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, fullName: true } } }
        }),
    ]);

    return {
        counts: {
            products: totalProducts, categories: totalCategories, suppliers: totalSuppliers,
            customers: totalCustomers, employees: totalEmployees
        },
        today: { sales: todaySales._count.id, revenue: Number(todaySales._sum.total) || 0 },
        month: { sales: monthSales._count.id, revenue: Number(monthSales._sum.total) || 0 },
        inventory: { value: Number(totalInventoryValue[0]?.value) || 0, lowStockCount: lowStockCount[0]?.count || 0, expiringCount },
        recentSales,
        recentActivities,
    };
};

const getSalesReport = (startDate, endDate) =>
    prisma.$queryRaw`
    SELECT
      DATE(s."createdAt") AS date,
      COUNT(s.id)::int AS "salesCount",
      SUM(s.total)::float AS revenue,
      SUM(s.discount)::float AS discounts,
      SUM(s.tax)::float AS taxes,
      SUM(si.quantity * si."costPrice")::float AS "totalCost",
      (SUM(s.total) - SUM(si.quantity * si."costPrice"))::float AS profit
    FROM sales s
    JOIN sale_items si ON si."saleId" = s.id AND si."isDeleted" = false
    WHERE s."isDeleted" = false AND s."isReturn" = false
      AND s."createdAt" >= ${startDate} AND s."createdAt" <= ${endDate}
    GROUP BY DATE(s."createdAt")
    ORDER BY date ASC
  `;

const getInventoryReport = () =>
    prisma.$queryRaw`
    SELECT p.id, p.name, p.sku, p.unit, p."minimumStock", p."sellingPrice"::float,
           c.name AS category,
           COALESCE(SUM(b."remainingQty"), 0)::int AS "currentStock",
           COALESCE(SUM(b."remainingQty" * b."buyingPrice"), 0)::float AS "inventoryValue",
           COALESCE(AVG(b."buyingPrice"), 0)::float AS "avgCost"
    FROM products p
    JOIN categories c ON c.id = p."categoryId"
    LEFT JOIN batches b ON b."productId" = p.id AND b."isDeleted" = false
    WHERE p."isDeleted" = false
    GROUP BY p.id, p.name, p.sku, p.unit, p."minimumStock", p."sellingPrice", c.name
    ORDER BY "inventoryValue" DESC
  `;

const getEmployeeSalesReport = (startDate, endDate) =>
    prisma.$queryRaw`
    SELECT e.id, e."firstName", e."lastName",
           COUNT(s.id)::int AS "salesCount",
           SUM(s.total)::float AS revenue,
           SUM(si.quantity * si."costPrice")::float AS "totalCost",
           (SUM(s.total) - SUM(si.quantity * si."costPrice"))::float AS profit
    FROM employees e
    JOIN sales s ON s."employeeId" = e.id AND s."isDeleted" = false AND s."isReturn" = false
    JOIN sale_items si ON si."saleId" = s.id AND si."isDeleted" = false
    WHERE s."createdAt" >= ${startDate} AND s."createdAt" <= ${endDate}
    GROUP BY e.id, e."firstName", e."lastName"
    ORDER BY revenue DESC
  `;

const getExpenseReport = (startDate, endDate) =>
    prisma.$queryRaw`
    SELECT ec.name AS category,
           COUNT(e.id)::int AS count,
           SUM(e.amount)::float AS total
    FROM expenses e
    JOIN expense_categories ec ON ec.id = e."categoryId"
    WHERE e."isDeleted" = false AND e."expenseDate" >= ${startDate} AND e."expenseDate" <= ${endDate}
    GROUP BY ec.name
    ORDER BY total DESC
  `;

const getProfitLossReport = (startDate, endDate) =>
    prisma.$queryRaw`
    SELECT
      SUM(s.total)::float AS "totalRevenue",
      SUM(si.quantity * si."costPrice")::float AS "totalCOGS",
      (SUM(s.total) - SUM(si.quantity * si."costPrice"))::float AS "grossProfit",
      COALESCE((SELECT SUM(amount)::float FROM expenses
                WHERE "isDeleted" = false AND "expenseDate" >= ${startDate} AND "expenseDate" <= ${endDate}), 0) AS "totalExpenses",
      (SUM(s.total) - SUM(si.quantity * si."costPrice") -
        COALESCE((SELECT SUM(amount) FROM expenses
                  WHERE "isDeleted" = false AND "expenseDate" >= ${startDate} AND "expenseDate" <= ${endDate}), 0)
      )::float AS "netProfit"
    FROM sales s
    JOIN sale_items si ON si."saleId" = s.id AND si."isDeleted" = false
    WHERE s."isDeleted" = false AND s."isReturn" = false
      AND s."createdAt" >= ${startDate} AND s."createdAt" <= ${endDate}
  `;

module.exports = {
    getDashboardStats, getSalesReport, getInventoryReport,
    getEmployeeSalesReport, getExpenseReport, getProfitLossReport,
};
