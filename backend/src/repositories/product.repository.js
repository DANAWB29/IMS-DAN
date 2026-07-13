'use strict';

const prisma = require('../prisma');

const productInclude = {
    category: true,
    productImages: { orderBy: { isPrimary: 'desc' } },
    _count: { select: { batches: true, saleItems: true } },
};

const findAll = ({ skip, take, where, orderBy }) =>
    prisma.product.findMany({
        where: { isDeleted: false, ...where },
        include: productInclude,
        skip, take, orderBy,
    });

const count = (where = {}) =>
    prisma.product.count({ where: { isDeleted: false, ...where } });

const findById = (id) =>
    prisma.product.findUnique({
        where: { id, isDeleted: false },
        include: productInclude,
    });

const findByName = (name) =>
    prisma.product.findUnique({ where: { name, isDeleted: false } });

const findBySku = (sku) =>
    prisma.product.findUnique({ where: { sku, isDeleted: false } });

const findByBarcode = (barcode) =>
    prisma.product.findUnique({ where: { barcode, isDeleted: false }, include: productInclude });

const create = (data) =>
    prisma.product.create({ data, include: productInclude });

const update = (id, data) =>
    prisma.product.update({ where: { id }, data, include: productInclude });

const softDelete = (id) =>
    prisma.product.update({ where: { id }, data: { isDeleted: true, isActive: false } });

// Add a product image
const addImage = (data) => prisma.productImage.create({ data });

// Set all product images to non-primary, then set one as primary
const setPrimaryImage = async (productId, imageId) => {
    await prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
    return prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });
};

// Delete a product image record
const deleteImage = (id) => prisma.productImage.delete({ where: { id } });

const findImageById = (id) => prisma.productImage.findUnique({ where: { id } });

// Get current stock for a product (sum of remaining qty across all batches)
const getCurrentStock = (productId) =>
    prisma.batch.aggregate({
        where: { productId, isDeleted: false },
        _sum: { remainingQty: true },
    });

// Inventory value = sum(batch.remainingQty * batch.buyingPrice)
const getInventoryValue = () =>
    prisma.$queryRaw`
    SELECT
      p.id,
      p.name,
      p.sku,
      SUM(b."remainingQty")::int AS "currentStock",
      AVG(b."buyingPrice")::float AS "avgCost",
      (SUM(b."remainingQty" * b."buyingPrice"))::float AS "inventoryValue"
    FROM products p
    JOIN batches b ON b."productId" = p.id
    WHERE p."isDeleted" = false AND b."isDeleted" = false
    GROUP BY p.id, p.name, p.sku
    ORDER BY "inventoryValue" DESC
  `;

// Low-stock products: currentStock < minimumStock
const getLowStockProducts = () =>
    prisma.$queryRaw`
    SELECT
      p.id, p.name, p.sku, p."minimumStock",
      COALESCE(SUM(b."remainingQty"), 0)::int AS "currentStock"
    FROM products p
    LEFT JOIN batches b ON b."productId" = p.id AND b."isDeleted" = false
    WHERE p."isDeleted" = false AND p."isActive" = true
    GROUP BY p.id, p.name, p.sku, p."minimumStock"
    HAVING COALESCE(SUM(b."remainingQty"), 0) < p."minimumStock"
    ORDER BY "currentStock" ASC
  `;

module.exports = {
    findAll, count, findById, findByName, findBySku, findByBarcode,
    create, update, softDelete,
    addImage, setPrimaryImage, deleteImage, findImageById,
    getCurrentStock, getInventoryValue, getLowStockProducts,
};
