'use strict';
const repo = require('../repositories/expense.repository');
const { logActivity } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { paginate } = require('../utils/apiResponse');

// Categories
const listCategories = () => repo.findAllCategories();
const createCategory = async (data, userId) => {
    const existing = await repo.findCategoryByName(data.name.trim());
    if (existing) throw new AppError('Category already exists.', 409);
    return repo.createCategory({ name: data.name.trim(), description: data.description?.trim() || null });
};
const updateCategory = async (id, data, userId) => {
    const cat = await repo.findCategoryById(id);
    if (!cat) throw new AppError('Category not found.', 404);
    return repo.updateCategory(id, data);
};
const deleteCategory = async (id, userId) => {
    const cat = await repo.findCategoryById(id);
    if (!cat) throw new AppError('Category not found.', 404);
    const expCount = await repo.count({ categoryId: id });
    if (expCount > 0) throw new AppError(`Cannot delete category with ${expCount} expense(s).`, 409);
    await repo.deleteCategory(id);
};

// Expenses
const listExpenses = async (query) => {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, ['expenseDate', 'createdAt', 'amount']);
    const where = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
        where.expenseDate = {};
        if (query.startDate) where.expenseDate.gte = new Date(query.startDate);
        if (query.endDate) where.expenseDate.lte = new Date(query.endDate);
    }
    const [expenses, total] = await Promise.all([
        repo.findAll({ skip, take: limit, where, orderBy: { [sortBy]: sortOrder } }),
        repo.count(where),
    ]);
    return { expenses, meta: paginate(total, page, limit) };
};

const getExpenseById = async (id) => {
    const e = await repo.findById(id);
    if (!e) throw new AppError('Expense not found.', 404);
    return e;
};

const createExpense = async (data, userId, ipAddress) => {
    const cat = await repo.findCategoryById(data.categoryId);
    if (!cat) throw new AppError('Expense category not found.', 404);
    const expense = await repo.create({
        title: data.title.trim(),
        amount: data.amount,
        description: data.description?.trim() || null,
        categoryId: data.categoryId,
        expenseDate: new Date(data.expenseDate),
        status: data.status || 'PENDING',
    });
    await logActivity({
        action: 'CREATE', userId, tableName: 'expenses', recordId: expense.id,
        description: `Expense created: ${expense.title}`, ipAddress
    });
    return expense;
};

const updateExpense = async (id, data, userId, ipAddress) => {
    const e = await repo.findById(id);
    if (!e) throw new AppError('Expense not found.', 404);
    const updateData = {};
    ['title', 'amount', 'description', 'categoryId', 'status'].forEach((f) => { if (data[f] !== undefined) updateData[f] = data[f]; });
    if (data.expenseDate) updateData.expenseDate = new Date(data.expenseDate);
    const updated = await repo.update(id, updateData);
    await logActivity({
        action: 'UPDATE', userId, tableName: 'expenses', recordId: id,
        description: `Expense updated: ${updated.title}`, ipAddress
    });
    return updated;
};

const deleteExpense = async (id, userId, ipAddress) => {
    const e = await repo.findById(id);
    if (!e) throw new AppError('Expense not found.', 404);
    await repo.softDelete(id);
    await logActivity({
        action: 'DELETE', userId, tableName: 'expenses', recordId: id,
        description: `Expense deleted: ${e.title}`, ipAddress
    });
};

module.exports = {
    listCategories, createCategory, updateCategory, deleteCategory,
    listExpenses, getExpenseById, createExpense, updateExpense, deleteExpense,
};
