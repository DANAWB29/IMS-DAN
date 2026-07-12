'use strict';

const repo = require('../repositories/category.repository');
const { logActivity } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { paginate } = require('../utils/apiResponse');

const listCategories = async (query) => {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, ['name', 'createdAt']);
    const where = {};
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true' || query.isActive === true;

    const [categories, total] = await Promise.all([
        repo.findAll({ skip, take: limit, where, orderBy: { [sortBy]: sortOrder } }),
        repo.count(where),
    ]);
    return { categories, meta: paginate(total, page, limit) };
};

const getCategoryById = async (id) => {
    const cat = await repo.findById(id);
    if (!cat) throw new AppError('Category not found.', 404);
    return cat;
};

const createCategory = async (data, userId, ipAddress) => {
    const existing = await repo.findByName(data.name.trim());
    if (existing) throw new AppError('A category with this name already exists.', 409);

    const category = await repo.create({ name: data.name.trim(), description: data.description?.trim() || null });

    await logActivity({
        action: 'CREATE', userId, tableName: 'categories', recordId: category.id,
        description: `Category created: ${category.name}`, newValues: data, ipAddress
    });
    return category;
};

const updateCategory = async (id, data, userId, ipAddress) => {
    const cat = await repo.findById(id);
    if (!cat) throw new AppError('Category not found.', 404);

    if (data.name && data.name.trim() !== cat.name) {
        const existing = await repo.findByName(data.name.trim());
        if (existing) throw new AppError('A category with this name already exists.', 409);
    }

    const updateData = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await repo.update(id, updateData);
    await logActivity({
        action: 'UPDATE', userId, tableName: 'categories', recordId: id,
        description: `Category updated: ${updated.name}`, oldValues: cat, newValues: updateData, ipAddress
    });
    return updated;
};

const deleteCategory = async (id, userId, ipAddress) => {
    const cat = await repo.findById(id);
    if (!cat) throw new AppError('Category not found.', 404);
    if (cat._count.products > 0) throw new AppError(`Cannot delete category with ${cat._count.products} product(s). Reassign or delete them first.`, 409);

    await repo.softDelete(id);
    await logActivity({
        action: 'DELETE', userId, tableName: 'categories', recordId: id,
        description: `Category deleted: ${cat.name}`, ipAddress
    });
};

module.exports = { listCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
