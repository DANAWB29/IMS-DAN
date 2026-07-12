'use strict';

const repo = require('../repositories/customer.repository');
const { logActivity } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { paginate } = require('../utils/apiResponse');

const listCustomers = async (query) => {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, ['name', 'createdAt']);
    const where = {};
    if (query.search) where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
    ];
    const [customers, total] = await Promise.all([
        repo.findAll({ skip, take: limit, where, orderBy: { [sortBy]: sortOrder } }),
        repo.count(where),
    ]);
    return { customers, meta: paginate(total, page, limit) };
};

const getCustomerById = async (id) => {
    const c = await repo.findById(id);
    if (!c) throw new AppError('Customer not found.', 404);
    return c;
};

const getCustomerHistory = async (id, query) => {
    const c = await repo.findById(id);
    if (!c) throw new AppError('Customer not found.', 404);
    const { page, limit, skip } = parsePagination(query);
    const [sales, total] = await Promise.all([
        repo.getCustomerSales(id, skip, limit),
        require('../prisma').sale.count({ where: { customerId: id, isDeleted: false } }),
    ]);
    return { customer: c, sales, meta: paginate(total, page, limit) };
};

const createCustomer = async (data, userId, ipAddress) => {
    if (data.phone) {
        const existing = await repo.findByPhone(data.phone.trim());
        if (existing) throw new AppError('A customer with this phone already exists.', 409);
    }
    const customer = await repo.create({
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.toLowerCase().trim() || null,
        address: data.address?.trim() || null,
    });
    await logActivity({
        action: 'CREATE', userId, tableName: 'customers', recordId: customer.id,
        description: `Customer created: ${customer.name}`, ipAddress
    });
    return customer;
};

const updateCustomer = async (id, data, userId, ipAddress) => {
    const c = await repo.findById(id);
    if (!c) throw new AppError('Customer not found.', 404);
    if (data.phone && data.phone !== c.phone) {
        const existing = await repo.findByPhone(data.phone.trim());
        if (existing) throw new AppError('A customer with this phone already exists.', 409);
    }
    const updateData = {};
    ['name', 'phone', 'address', 'isActive'].forEach((f) => {
        if (data[f] !== undefined) updateData[f] = typeof data[f] === 'string' ? data[f].trim() : data[f];
    });
    if (data.email !== undefined) updateData.email = data.email?.toLowerCase().trim() || null;
    const updated = await repo.update(id, updateData);
    await logActivity({
        action: 'UPDATE', userId, tableName: 'customers', recordId: id,
        description: `Customer updated: ${updated.name}`, ipAddress
    });
    return updated;
};

const deleteCustomer = async (id, userId, ipAddress) => {
    const c = await repo.findById(id);
    if (!c) throw new AppError('Customer not found.', 404);
    if (c._count.sales > 0) throw new AppError(`Cannot delete customer with ${c._count.sales} sale(s) on record.`, 409);
    await repo.softDelete(id);
    await logActivity({
        action: 'DELETE', userId, tableName: 'customers', recordId: id,
        description: `Customer deleted: ${c.name}`, ipAddress
    });
};

module.exports = { listCustomers, getCustomerById, getCustomerHistory, createCustomer, updateCustomer, deleteCustomer };
