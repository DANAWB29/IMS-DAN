'use strict';

const repo = require('../repositories/report.repository');
const AppError = require('../utils/AppError');

const validateDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) throw new AppError('startDate and endDate are required.', 400);
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new AppError('Invalid date format.', 400);
    if (start > end) throw new AppError('startDate must be before endDate.', 400);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

const getDashboard = () => repo.getDashboardStats();
const getSalesReport = ({ startDate, endDate }) => { const { start, end } = validateDateRange(startDate, endDate); return repo.getSalesReport(start, end); };
const getInventoryReport = () => repo.getInventoryReport();
const getEmployeeSalesReport = ({ startDate, endDate }) => { const { start, end } = validateDateRange(startDate, endDate); return repo.getEmployeeSalesReport(start, end); };
const getExpenseReport = ({ startDate, endDate }) => { const { start, end } = validateDateRange(startDate, endDate); return repo.getExpenseReport(start, end); };
const getProfitLoss = ({ startDate, endDate }) => { const { start, end } = validateDateRange(startDate, endDate); return repo.getProfitLossReport(start, end); };

module.exports = { getDashboard, getSalesReport, getInventoryReport, getEmployeeSalesReport, getExpenseReport, getProfitLoss };
