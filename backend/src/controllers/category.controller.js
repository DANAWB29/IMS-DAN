'use strict';

const svc = require('../services/category.service');
const { success } = require('../utils/apiResponse');
const { HTTP } = require('../constants');

const list = async (req, res, next) => { try { const r = await svc.listCategories(req.query); return success(res, 'Categories retrieved.', r.categories, HTTP.OK, r.meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return success(res, 'Category retrieved.', await svc.getCategoryById(req.params.id)); } catch (e) { next(e); } };
const create = async (req, res, next) => { try { return success(res, 'Category created.', await svc.createCategory(req.body, req.user.id, req.ip), HTTP.CREATED); } catch (e) { next(e); } };
const update = async (req, res, next) => { try { return success(res, 'Category updated.', await svc.updateCategory(req.params.id, req.body, req.user.id, req.ip)); } catch (e) { next(e); } };
const remove = async (req, res, next) => { try { await svc.deleteCategory(req.params.id, req.user.id, req.ip); return success(res, 'Category deleted.'); } catch (e) { next(e); } };

module.exports = { list, getById, create, update, remove };
