'use strict';
const svc = require('../services/report.service');
const { success } = require('../utils/apiResponse');

const dashboard = async (req, res, next) => { try { return success(res, 'Dashboard data.', await svc.getDashboard()); } catch (e) { next(e); } };
const salesReport = async (req, res, next) => { try { return success(res, 'Sales report.', await svc.getSalesReport(req.query)); } catch (e) { next(e); } };
const inventoryReport = async (req, res, next) => { try { return success(res, 'Inventory report.', await svc.getInventoryReport()); } catch (e) { next(e); } };
const employeeReport = async (req, res, next) => { try { return success(res, 'Employee sales report.', await svc.getEmployeeSalesReport(req.query)); } catch (e) { next(e); } };
const expenseReport = async (req, res, next) => { try { return success(res, 'Expense report.', await svc.getExpenseReport(req.query)); } catch (e) { next(e); } };
const profitLoss = async (req, res, next) => { try { return success(res, 'Profit & Loss.', await svc.getProfitLoss(req.query)); } catch (e) { next(e); } };

module.exports = { dashboard, salesReport, inventoryReport, employeeReport, expenseReport, profitLoss };
