'use strict';
const prisma = require('../prisma');

// Expense Categories
const findAllCategories = () => prisma.expenseCategory.findMany({ where: { isDeleted: false }, orderBy: { name: 'asc' } });
const findCategoryById = (id) => prisma.expenseCategory.findUnique({ where: { id, isDeleted: false } });
const findCategoryByName = (name) => prisma.expenseCategory.findUnique({ where: { name, isDeleted: false } });
const createCategory = (data) => prisma.expenseCategory.create({ data });
const updateCategory = (id, data) => prisma.expenseCategory.update({ where: { id }, data });
const deleteCategory = (id) => prisma.expenseCategory.update({ where: { id }, data: { isDeleted: true } });

// Expenses
const findAll = ({ skip, take, where, orderBy }) =>
    prisma.expense.findMany({ where: { isDeleted: false, ...where }, include: { category: true }, skip, take, orderBy });
const count = (where = {}) => prisma.expense.count({ where: { isDeleted: false, ...where } });
const findById = (id) => prisma.expense.findUnique({ where: { id, isDeleted: false }, include: { category: true } });
const create = (data) => prisma.expense.create({ data, include: { category: true } });
const update = (id, data) => prisma.expense.update({ where: { id }, data, include: { category: true } });
const softDelete = (id) => prisma.expense.update({ where: { id }, data: { isDeleted: true } });

module.exports = {
    findAllCategories, findCategoryById, findCategoryByName, createCategory, updateCategory, deleteCategory,
    findAll, count, findById, create, update, softDelete,
};
