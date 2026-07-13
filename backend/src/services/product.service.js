'use strict';

const fs = require('fs');
const path = require('path');
const repo = require('../repositories/product.repository');
const catRepo = require('../repositories/category.repository');
const { generateUniqueBarcode, generateUniqueSKU } = require('../utils/barcode');
const { logActivity } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { paginate } = require('../utils/apiResponse');

const listProducts = async (query) => {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query,
        ['name', 'createdAt', 'sellingPrice', 'costPrice']);

    const where = {};
    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: 'insensitive' } },
            { sku: { contains: query.search, mode: 'insensitive' } },
            { barcode: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
        ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true' || query.isActive === true;
    if (query.minPrice) where.sellingPrice = { ...where.sellingPrice, gte: parseFloat(query.minPrice) };
    if (query.maxPrice) where.sellingPrice = { ...where.sellingPrice, lte: parseFloat(query.maxPrice) };

    const [products, total] = await Promise.all([
        repo.findAll({ skip, take: limit, where, orderBy: { [sortBy]: sortOrder } }),
        repo.count(where),
    ]);

    // Attach current stock to each product
    const withStock = await Promise.all(products.map(async (p) => {
        const stock = await repo.getCurrentStock(p.id);
        return { ...p, currentStock: stock._sum.remainingQty || 0 };
    }));

    // If lowStock filter requested, filter after stock calculation
    const filtered = query.lowStock === 'true' || query.lowStock === true
        ? withStock.filter((p) => p.currentStock < p.minimumStock)
        : withStock;

    return { products: filtered, meta: paginate(total, page, limit) };
};

const getProductById = async (id) => {
    const product = await repo.findById(id);
    if (!product) throw new AppError('Product not found.', 404);
    const stock = await repo.getCurrentStock(id);
    return { ...product, currentStock: stock._sum.remainingQty || 0 };
};

const getProductByBarcode = async (barcode) => {
    const product = await repo.findByBarcode(barcode);
    if (!product) throw new AppError('Product not found for this barcode.', 404);
    const stock = await repo.getCurrentStock(product.id);
    return { ...product, currentStock: stock._sum.remainingQty || 0 };
};

const createProduct = async (data, userId, ipAddress) => {
    // Validate category exists
    const category = await catRepo.findById(data.categoryId);
    if (!category) throw new AppError('Category not found.', 404);

    // Check name uniqueness
    const existingName = await repo.findByName(data.name.trim());
    if (existingName) throw new AppError('A product with this name already exists.', 409);

    // Check or generate barcode
    let barcode = data.barcode || null;
    if (barcode) {
        const existingBarcode = await repo.findByBarcode(barcode);
        if (existingBarcode) throw new AppError('A product with this barcode already exists.', 409);
    } else {
        barcode = await generateUniqueBarcode();
    }

    // Check or generate SKU
    let sku = data.sku || null;
    if (sku) {
        const existingSku = await repo.findBySku(sku);
        if (existingSku) throw new AppError('A product with this SKU already exists.', 409);
    } else {
        sku = await generateUniqueSKU(category.name);
    }

    const product = await repo.create({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice,
        minimumStock: data.minimumStock ?? 10,
        unit: data.unit.trim(),
        categoryId: data.categoryId,
        barcode,
        sku,
        isActive: data.isActive ?? true,
    });

    await logActivity({
        action: 'CREATE', userId, tableName: 'products', recordId: product.id,
        description: `Product created: ${product.name} [SKU: ${product.sku}]`, newValues: data, ipAddress
    });

    return { ...product, currentStock: 0 };
};

const updateProduct = async (id, data, userId, ipAddress) => {
    const product = await repo.findById(id);
    if (!product) throw new AppError('Product not found.', 404);

    if (data.name && data.name.trim() !== product.name) {
        const existing = await repo.findByName(data.name.trim());
        if (existing) throw new AppError('A product with this name already exists.', 409);
    }

    if (data.barcode && data.barcode !== product.barcode) {
        const existing = await repo.findByBarcode(data.barcode);
        if (existing) throw new AppError('A product with this barcode already exists.', 409);
    }

    if (data.categoryId) {
        const category = await catRepo.findById(data.categoryId);
        if (!category) throw new AppError('Category not found.', 404);
    }

    const updateData = {};
    const fields = ['name', 'description', 'sellingPrice', 'costPrice', 'minimumStock', 'unit', 'categoryId', 'barcode', 'isActive'];
    fields.forEach((f) => { if (data[f] !== undefined) updateData[f] = data[f]; });
    if (data.name) updateData.name = data.name.trim();

    const updated = await repo.update(id, updateData);
    const stock = await repo.getCurrentStock(id);

    await logActivity({
        action: 'UPDATE', userId, tableName: 'products', recordId: id,
        description: `Product updated: ${updated.name}`, oldValues: product, newValues: updateData, ipAddress
    });

    return { ...updated, currentStock: stock._sum.remainingQty || 0 };
};

const deleteProduct = async (id, userId, ipAddress) => {
    const product = await repo.findById(id);
    if (!product) throw new AppError('Product not found.', 404);

    const stock = await repo.getCurrentStock(id);
    if ((stock._sum.remainingQty || 0) > 0) {
        throw new AppError('Cannot delete product with stock remaining. Adjust stock to zero first.', 409);
    }

    await repo.softDelete(id);
    await logActivity({
        action: 'DELETE', userId, tableName: 'products', recordId: id,
        description: `Product deleted: ${product.name}`, ipAddress
    });
};

const uploadProductImages = async (productId, files, userId) => {
    const product = await repo.findById(productId);
    if (!product) throw new AppError('Product not found.', 404);
    if (!files || files.length === 0) throw new AppError('No image files provided.', 400);

    const existingImages = product.productImages || [];
    const isFirstImage = existingImages.length === 0;

    const images = await Promise.all(
        files.map((file, idx) =>
            repo.addImage({
                productId,
                url: `/uploads/products/${file.filename}`,
                isPrimary: isFirstImage && idx === 0,
            })
        )
    );

    await logActivity({
        action: 'UPLOAD_IMAGES', userId, tableName: 'products', recordId: productId,
        description: `${files.length} image(s) uploaded for product: ${product.name}`
    });

    return images;
};

const setPrimaryImage = async (productId, imageId, userId) => {
    const product = await repo.findById(productId);
    if (!product) throw new AppError('Product not found.', 404);

    const image = await repo.findImageById(imageId);
    if (!image || image.productId !== productId) throw new AppError('Image not found for this product.', 404);

    await repo.setPrimaryImage(productId, imageId);
    await logActivity({
        action: 'SET_PRIMARY_IMAGE', userId, tableName: 'products', recordId: productId,
        description: `Primary image set for product: ${product.name}`
    });

    return repo.findById(productId);
};

const deleteProductImage = async (productId, imageId, userId) => {
    const image = await repo.findImageById(imageId);
    if (!image || image.productId !== productId) throw new AppError('Image not found for this product.', 404);

    // Delete file from disk
    const filePath = path.join(process.cwd(), image.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await repo.deleteImage(imageId);
    await logActivity({
        action: 'DELETE_IMAGE', userId, tableName: 'products', recordId: productId,
        description: `Image deleted from product`
    });
};

const getInventoryValue = () => repo.getInventoryValue();
const getLowStockProducts = () => repo.getLowStockProducts();

module.exports = {
    listProducts, getProductById, getProductByBarcode,
    createProduct, updateProduct, deleteProduct,
    uploadProductImages, setPrimaryImage, deleteProductImage,
    getInventoryValue, getLowStockProducts,
};
