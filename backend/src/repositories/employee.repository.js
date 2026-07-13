'use strict';

const prisma = require('../prisma');

const findAll = ({ skip, take, where, orderBy }) =>
    prisma.employee.findMany({
        where: { isDeleted: false, ...where },
        include: { branch: true },
        skip,
        take,
        orderBy,
    });

const count = (where = {}) =>
    prisma.employee.count({ where: { isDeleted: false, ...where } });

const findById = (id) =>
    prisma.employee.findUnique({
        where: { id, isDeleted: false },
        include: { branch: true },
    });

const findByEmail = (email) =>
    prisma.employee.findUnique({
        where: { email, isDeleted: false },
        include: { branch: true },
    });

const findByPhone = (phone) =>
    prisma.employee.findUnique({
        where: { phone, isDeleted: false },
    });

const create = (data) =>
    prisma.employee.create({
        data,
        include: { branch: true },
    });

const update = (id, data) =>
    prisma.employee.update({
        where: { id },
        data,
        include: { branch: true },
    });

const softDelete = (id) =>
    prisma.employee.update({
        where: { id },
        data: { isDeleted: true, isActive: false },
    });

// Attendance
const createAttendance = (data) =>
    prisma.attendance.create({
        data,
        include: { employee: true },
    });

const findAttendanceById = (id) =>
    prisma.attendance.findUnique({
        where: { id, isDeleted: false },
        include: { employee: true },
    });

const findAttendanceByEmployeeAndDate = (employeeId, date) =>
    prisma.attendance.findUnique({
        where: {
            employeeId_date: { employeeId, date },
        },
        include: { employee: true },
    });

const updateAttendance = (id, data) =>
    prisma.attendance.update({
        where: { id },
        data,
        include: { employee: true },
    });

const findAllAttendance = ({ skip, take, where, orderBy }) =>
    prisma.attendance.findMany({
        where: { isDeleted: false, ...where },
        include: { employee: true },
        skip,
        take,
        orderBy,
    });

const countAttendance = (where = {}) =>
    prisma.attendance.count({ where: { isDeleted: false, ...where } });

const softDeleteAttendance = (id) =>
    prisma.attendance.update({
        where: { id },
        data: { isDeleted: true },
    });

// Employee attendance summary for a date range
const getAttendanceSummary = (employeeId, startDate, endDate) =>
    prisma.attendance.groupBy({
        by: ['status'],
        where: {
            employeeId,
            isDeleted: false,
            date: { gte: startDate, lte: endDate },
        },
        _count: { status: true },
    });

module.exports = {
    findAll,
    count,
    findById,
    findByEmail,
    findByPhone,
    create,
    update,
    softDelete,
    createAttendance,
    findAttendanceById,
    findAttendanceByEmployeeAndDate,
    updateAttendance,
    findAllAttendance,
    countAttendance,
    softDeleteAttendance,
    getAttendanceSummary,
};
