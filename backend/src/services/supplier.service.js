'use strict';

const repo = require('../repositories/supplier.repository');
const { logActivity } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { paginate } = require('../utils/apiResponse');

const listSuppliers = async (query) => {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, ['name', 'createdAt']);
    const where = {};
    if (query.search) where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
    ];
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true' || query.isActive === true;

    const [suppliers, total] = await Promise.all([
        repo.findAll({ skip, take: limit, where, orderBy: { [sortBy]: sortOrder } }),
        repo.count(where),
    ]);
    return { suppliers, meta: paginate(total, page, limit) };
};

const getSupplierById = async (id) => {
    const s = await repo.findById(id);
    if (!s) throw new AppError('Supplier not found.', 404);
    return s;
};

const createSupplier = async (data, userId, ipAddress) => {
    const existing = await repo.findByName(data.name.trim());
    if (existing) throw new AppError('A supplier with this name already exists.', 409);
    if (data.email) {
        const byEmail = await repo.findByEmail(data.email.toLowerCase().trim());
        if (byEmail) throw new AppError('A supplier with this email already exists.', 409);
    }
    const supplier = await repo.create({
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.toLowerCase().trim() || null,
        address: data.address?.trim() || null,
        contactPerson: data.contactPerson?.trim() || null,
    });
    await logActivity({
        action: 'CREATE', userId, tableName: 'suppliers', recordId: supplier.id,
        description: `Supplier created: ${supplier.name}`, newValues: data, ipAddress
    });
    return supplier;
};

const updateSupplier = async (id, data, userId, ipAddress) => {
    const s = await repo.findById(id);
    if (!s) throw new AppError('Supplier not found.', 404);
    if (data.name && data.name.trim() !== s.name) {
        const existing = await repo.findByName(data.name.trim());
        if (existing) throw new AppError('A supplier with this name already exists.', 409);
    }
    const updateData = {};
    ['name', 'phone', 'address', 'contactPerson', 'isActive'].forEach((f) => {
        if (data[f] !== undefined) updateData[f] = typeof data[f] === 'string' ? data[f].trim() : data[f];
    });
    if (data.email !== undefined) updateData.email = data.email?.toLowerCase().trim() || null;
    const updated = await repo.update(id, updateData);
    await logActivity({
        action: 'UPDATE', userId, tableName: 'suppliers', recordId: id,
        description: `Supplier updated: ${updated.name}`, oldValues: s, newValues: updateData, ipAddress
    });
    return updated;
};

const deleteSupplier = async (id, userId, ipAddress) => {
    const s = await repo.findById(id);
    if (!s) throw new AppError('Supplier not found.', 404);
    if (s._count.purchases > 0) throw new AppError(`Cannot delete supplier with ${s._count.purchases} purchase(s) on record.`, 409);
    await repo.softDelete(id);
    await logActivity({
        action: 'DELETE', userId, tableName: 'suppliers', recordId: id,
        description: `Supplier deleted: ${s.name}`, ipAddress
    });
};

module.exports = { listSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier };
