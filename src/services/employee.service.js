'use strict';

const repo = require('../repositories/employee.repository');
const { logActivity } = require('../utils/activityLogger');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { paginate } = require('../utils/apiResponse');

// ─── Employees ───────────────────────────────────────────────

const listEmployees = async (query) => {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, [
        'firstName', 'lastName', 'createdAt', 'salary', 'hireDate',
    ]);

    const where = {};

    if (query.search) {
        where.OR = [
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search, mode: 'insensitive' } },
        ];
    }

    if (query.isActive !== undefined) {
        where.isActive = query.isActive === 'true' || query.isActive === true;
    }

    if (query.branchId) where.branchId = query.branchId;
    if (query.department) where.department = { contains: query.department, mode: 'insensitive' };

    const [employees, total] = await Promise.all([
        repo.findAll({ skip, take: limit, where, orderBy: { [sortBy]: sortOrder } }),
        repo.count(where),
    ]);

    return { employees, meta: paginate(total, page, limit) };
};

const getEmployeeById = async (id) => {
    const employee = await repo.findById(id);
    if (!employee) throw new AppError('Employee not found.', 404);
    return employee;
};

const createEmployee = async (data, requesterId, ipAddress) => {
    // Check for duplicate email
    if (data.email) {
        const existing = await repo.findByEmail(data.email.toLowerCase().trim());
        if (existing) throw new AppError('An employee with this email already exists.', 409);
    }

    // Check for duplicate phone
    if (data.phone) {
        const existing = await repo.findByPhone(data.phone.trim());
        if (existing) throw new AppError('An employee with this phone number already exists.', 409);
    }

    const employee = await repo.create({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.toLowerCase().trim() || null,
        address: data.address?.trim() || null,
        salary: data.salary,
        hireDate: new Date(data.hireDate),
        position: data.position?.trim() || null,
        department: data.department?.trim() || null,
        branchId: data.branchId || null,
    });

    await logActivity({
        action: 'CREATE',
        userId: requesterId,
        tableName: 'employees',
        recordId: employee.id,
        description: `Employee created: ${employee.firstName} ${employee.lastName}`,
        newValues: data,
        ipAddress,
    });

    return employee;
};

const updateEmployee = async (id, data, requesterId, ipAddress) => {
    const employee = await repo.findById(id);
    if (!employee) throw new AppError('Employee not found.', 404);

    // Check email uniqueness on change
    if (data.email && data.email.toLowerCase() !== employee.email) {
        const existing = await repo.findByEmail(data.email.toLowerCase().trim());
        if (existing) throw new AppError('An employee with this email already exists.', 409);
    }

    // Check phone uniqueness on change
    if (data.phone && data.phone !== employee.phone) {
        const existing = await repo.findByPhone(data.phone.trim());
        if (existing) throw new AppError('An employee with this phone number already exists.', 409);
    }

    const updateData = {};
    const fields = ['firstName', 'lastName', 'phone', 'address', 'salary', 'position', 'department', 'branchId', 'isActive'];
    fields.forEach((f) => { if (data[f] !== undefined) updateData[f] = data[f]; });
    if (data.email !== undefined) updateData.email = data.email?.toLowerCase().trim() || null;
    if (data.hireDate !== undefined) updateData.hireDate = new Date(data.hireDate);

    const updated = await repo.update(id, updateData);

    await logActivity({
        action: 'UPDATE',
        userId: requesterId,
        tableName: 'employees',
        recordId: id,
        description: `Employee updated: ${updated.firstName} ${updated.lastName}`,
        oldValues: { firstName: employee.firstName, lastName: employee.lastName },
        newValues: updateData,
        ipAddress,
    });

    return updated;
};

const deleteEmployee = async (id, requesterId, ipAddress) => {
    const employee = await repo.findById(id);
    if (!employee) throw new AppError('Employee not found.', 404);

    await repo.softDelete(id);

    await logActivity({
        action: 'DELETE',
        userId: requesterId,
        tableName: 'employees',
        recordId: id,
        description: `Employee deleted: ${employee.firstName} ${employee.lastName}`,
        ipAddress,
    });
};

// ─── Attendance ──────────────────────────────────────────────

const listAttendance = async (query) => {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, ['date', 'createdAt']);

    const where = {};
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
        where.date = {};
        if (query.startDate) where.date.gte = new Date(query.startDate);
        if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const [records, total] = await Promise.all([
        repo.findAllAttendance({ skip, take: limit, where, orderBy: { [sortBy]: sortOrder } }),
        repo.countAttendance(where),
    ]);

    return { attendance: records, meta: paginate(total, page, limit) };
};

const getAttendanceById = async (id) => {
    const record = await repo.findAttendanceById(id);
    if (!record) throw new AppError('Attendance record not found.', 404);
    return record;
};

const checkIn = async ({ employeeId, notes }, requesterId, ipAddress) => {
    const employee = await repo.findById(employeeId);
    if (!employee) throw new AppError('Employee not found.', 404);
    if (!employee.isActive) throw new AppError('Employee is inactive.', 400);

    // Use today's date (date only, no time component)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await repo.findAttendanceByEmployeeAndDate(employeeId, today);
    if (existing) {
        if (existing.checkIn) throw new AppError('Employee has already checked in today.', 409);
        // Record exists (e.g. pre-marked ABSENT) — update it
        const updated = await repo.updateAttendance(existing.id, {
            checkIn: new Date(),
            status: 'PRESENT',
            notes: notes || existing.notes,
        });

        // Calculate hours if already checked out
        if (updated.checkOut) {
            const hours = (updated.checkOut - updated.checkIn) / (1000 * 60 * 60);
            await repo.updateAttendance(existing.id, { hoursWorked: parseFloat(hours.toFixed(2)) });
        }
        return updated;
    }

    // Determine if late (after 09:00 AM by default — configurable via settings later)
    const LATE_THRESHOLD_HOUR = 9;
    const checkInTime = new Date();
    const status = checkInTime.getHours() >= LATE_THRESHOLD_HOUR ? 'LATE' : 'PRESENT';

    const record = await repo.createAttendance({
        employeeId,
        date: today,
        checkIn: checkInTime,
        status,
        notes: notes || null,
    });

    await logActivity({
        action: 'CHECK_IN',
        userId: requesterId,
        tableName: 'attendances',
        recordId: record.id,
        description: `${employee.firstName} ${employee.lastName} checked in`,
        ipAddress,
    });

    return record;
};

const checkOut = async ({ employeeId, notes }, requesterId, ipAddress) => {
    const employee = await repo.findById(employeeId);
    if (!employee) throw new AppError('Employee not found.', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await repo.findAttendanceByEmployeeAndDate(employeeId, today);
    if (!record) throw new AppError('No check-in record found for today.', 400);
    if (!record.checkIn) throw new AppError('Employee has not checked in today.', 400);
    if (record.checkOut) throw new AppError('Employee has already checked out today.', 409);

    const checkOutTime = new Date();
    const hoursWorked = (checkOutTime - record.checkIn) / (1000 * 60 * 60);

    const updated = await repo.updateAttendance(record.id, {
        checkOut: checkOutTime,
        hoursWorked: parseFloat(hoursWorked.toFixed(2)),
        notes: notes || record.notes,
    });

    await logActivity({
        action: 'CHECK_OUT',
        userId: requesterId,
        tableName: 'attendances',
        recordId: record.id,
        description: `${employee.firstName} ${employee.lastName} checked out. Hours: ${hoursWorked.toFixed(2)}`,
        ipAddress,
    });

    return updated;
};

const markAttendance = async (data, requesterId, ipAddress) => {
    const employee = await repo.findById(data.employeeId);
    if (!employee) throw new AppError('Employee not found.', 404);

    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    const existing = await repo.findAttendanceByEmployeeAndDate(data.employeeId, date);

    let hoursWorked = null;
    if (data.checkIn && data.checkOut) {
        hoursWorked = parseFloat(((new Date(data.checkOut) - new Date(data.checkIn)) / (1000 * 60 * 60)).toFixed(2));
    }

    const payload = {
        status: data.status,
        checkIn: data.checkIn ? new Date(data.checkIn) : null,
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
        hoursWorked,
        notes: data.notes || null,
    };

    let record;
    if (existing) {
        record = await repo.updateAttendance(existing.id, payload);
    } else {
        record = await repo.createAttendance({ employeeId: data.employeeId, date, ...payload });
    }

    await logActivity({
        action: existing ? 'UPDATE' : 'CREATE',
        userId: requesterId,
        tableName: 'attendances',
        recordId: record.id,
        description: `Attendance marked for ${employee.firstName} ${employee.lastName} on ${date.toDateString()}: ${data.status}`,
        ipAddress,
    });

    return record;
};

const updateAttendance = async (id, data, requesterId, ipAddress) => {
    const record = await repo.findAttendanceById(id);
    if (!record) throw new AppError('Attendance record not found.', 404);

    const updateData = {};
    if (data.status) updateData.status = data.status;
    if (data.checkIn !== undefined) updateData.checkIn = data.checkIn ? new Date(data.checkIn) : null;
    if (data.checkOut !== undefined) updateData.checkOut = data.checkOut ? new Date(data.checkOut) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Recalculate hours if both times are present
    const checkIn = updateData.checkIn !== undefined ? updateData.checkIn : record.checkIn;
    const checkOut = updateData.checkOut !== undefined ? updateData.checkOut : record.checkOut;
    if (checkIn && checkOut) {
        updateData.hoursWorked = parseFloat(((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2));
    }

    const updated = await repo.updateAttendance(id, updateData);

    await logActivity({
        action: 'UPDATE',
        userId: requesterId,
        tableName: 'attendances',
        recordId: id,
        description: `Attendance record updated`,
        ipAddress,
    });

    return updated;
};

const deleteAttendance = async (id, requesterId, ipAddress) => {
    const record = await repo.findAttendanceById(id);
    if (!record) throw new AppError('Attendance record not found.', 404);

    await repo.softDeleteAttendance(id);

    await logActivity({
        action: 'DELETE',
        userId: requesterId,
        tableName: 'attendances',
        recordId: id,
        description: `Attendance record deleted`,
        ipAddress,
    });
};

const getAttendanceSummary = async (employeeId, startDate, endDate) => {
    const employee = await repo.findById(employeeId);
    if (!employee) throw new AppError('Employee not found.', 404);

    const summary = await repo.getAttendanceSummary(
        employeeId,
        new Date(startDate),
        new Date(endDate)
    );

    const result = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    summary.forEach((s) => { result[s.status] = s._count.status; });

    return {
        employee: {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
        },
        period: { startDate, endDate },
        summary: result,
        total: Object.values(result).reduce((a, b) => a + b, 0),
    };
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
