'use strict';
const svc = require('../services/expense.service');
const { success } = require('../utils/apiResponse');
const { HTTP } = require('../constants');

// Categories
const listCategories = async (req, res, next) => { try { return success(res, 'Categories retrieved.', await svc.listCategories()); } catch (e) { next(e); } };
const createCategory = async (req, res, next) => { try { return success(res, 'Category created.', await svc.createCategory(req.body, req.user.id), HTTP.CREATED); } catch (e) { next(e); } };
const updateCategory = async (req, res, next) => { try { return success(res, 'Category updated.', await svc.updateCategory(req.params.id, req.body, req.user.id)); } catch (e) { next(e); } };
const deleteCategory = async (req, res, next) => { try { await svc.deleteCategory(req.params.id, req.user.id); return success(res, 'Category deleted.'); } catch (e) { next(e); } };

// Expenses
const list = async (req, res, next) => { try { const r = await svc.listExpenses(req.query); return success(res, 'Expenses retrieved.', r.expenses, HTTP.OK, r.meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return success(res, 'Expense retrieved.', await svc.getExpenseById(req.params.id)); } catch (e) { next(e); } };
const create = async (req, res, next) => { try { return success(res, 'Expense created.', await svc.createExpense(req.body, req.user.id, req.ip), HTTP.CREATED); } catch (e) { next(e); } };
const update = async (req, res, next) => { try { return success(res, 'Expense updated.', await svc.updateExpense(req.params.id, req.body, req.user.id, req.ip)); } catch (e) { next(e); } };
const remove = async (req, res, next) => { try { await svc.deleteExpense(req.params.id, req.user.id, req.ip); return success(res, 'Expense deleted.'); } catch (e) { next(e); } };

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, list, getById, create, update, remove };
