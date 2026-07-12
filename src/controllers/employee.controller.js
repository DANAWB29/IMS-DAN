'use strict';

const employeeService = require('../services/employee.service');
const { success } = require('../utils/apiResponse');
const { HTTP } = require('../constants');

// ─── Employees ───────────────────────────────────────────────

const listEmployees = async (req, res, next) => {
    try {
        const result = await employeeService.listEmployees(req.query);
        return success(res, 'Employees retrieved successfully.', result.employees, HTTP.OK, result.meta);
    } catch (err) {
        next(err);
    }
};

const getEmployeeById = async (req, res, next) => {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id);
        return success(res, 'Employee retrieved successfully.', employee);
    } catch (err) {
        next(err);
    }
};

const createEmployee = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const employee = await employeeService.createEmployee(req.body, req.user.id, ipAddress);
        return success(res, 'Employee created successfully.', employee, HTTP.CREATED);
    } catch (err) {
        next(err);
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const employee = await employeeService.updateEmployee(req.params.id, req.body, req.user.id, ipAddress);
        return success(res, 'Employee updated successfully.', employee);
    } catch (err) {
        next(err);
    }
};

const deleteEmployee = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        await employeeService.deleteEmployee(req.params.id, req.user.id, ipAddress);
        return success(res, 'Employee deleted successfully.');
    } catch (err) {
        next(err);
    }
};

// ─── Attendance ──────────────────────────────────────────────

const listAttendance = async (req, res, next) => {
    try {
        const result = await employeeService.listAttendance(req.query);
        return success(res, 'Attendance records retrieved successfully.', result.attendance, HTTP.OK, result.meta);
    } catch (err) {
        next(err);
    }
};

const getAttendanceById = async (req, res, next) => {
    try {
        const record = await employeeService.getAttendanceById(req.params.id);
        return success(res, 'Attendance record retrieved successfully.', record);
    } catch (err) {
        next(err);
    }
};

const checkIn = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const record = await employeeService.checkIn(req.body, req.user.id, ipAddress);
        return success(res, 'Check-in recorded successfully.', record, HTTP.CREATED);
    } catch (err) {
        next(err);
    }
};

const checkOut = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const record = await employeeService.checkOut(req.body, req.user.id, ipAddress);
        return success(res, 'Check-out recorded successfully.', record);
    } catch (err) {
        next(err);
    }
};

const markAttendance = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const record = await employeeService.markAttendance(req.body, req.user.id, ipAddress);
        return success(res, 'Attendance marked successfully.', record, HTTP.CREATED);
    } catch (err) {
        next(err);
    }
};

const updateAttendance = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const record = await employeeService.updateAttendance(req.params.id, req.body, req.user.id, ipAddress);
        return success(res, 'Attendance updated successfully.', record);
    } catch (err) {
        next(err);
    }
};

const deleteAttendance = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        await employeeService.deleteAttendance(req.params.id, req.user.id, ipAddress);
        return success(res, 'Attendance record deleted successfully.');
    } catch (err) {
        next(err);
    }
};

const getAttendanceSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'startDate and endDate query params are required.' });
        }
        const summary = await employeeService.getAttendanceSummary(req.params.id, startDate, endDate);
        return success(res, 'Attendance summary retrieved successfully.', summary);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    listEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    listAttendance,
    getAttendanceById,
    checkIn,
    checkOut,
    markAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceSummary,
};
