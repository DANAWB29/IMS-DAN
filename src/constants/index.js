'use strict';

// User Roles
const ROLES = {
    ADMIN: 'ADMIN',
    STORE: 'STORE',
};

// Attendance status
const ATTENDANCE_STATUS = {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    LATE: 'LATE',
    LEAVE: 'LEAVE',
};

// Stock movement types
const STOCK_MOVEMENT_TYPES = {
    STOCK_IN: 'STOCK_IN',
    STOCK_OUT: 'STOCK_OUT',
    SALE: 'SALE',
    RETURN: 'RETURN',
    ADJUSTMENT: 'ADJUSTMENT',
    TRANSFER: 'TRANSFER',
};

// Payment methods
const PAYMENT_METHODS = {
    CASH: 'CASH',
    CREDIT: 'CREDIT',
    BANK_TRANSFER: 'BANK_TRANSFER',
    MOBILE_MONEY: 'MOBILE_MONEY',
};

// Payment status
const PAYMENT_STATUS = {
    PAID: 'PAID',
    UNPAID: 'UNPAID',
    PARTIAL: 'PARTIAL',
};

// Notification types
const NOTIFICATION_TYPES = {
    LOW_STOCK: 'LOW_STOCK',
    EXPIRY: 'EXPIRY',
    SYSTEM: 'SYSTEM',
    SALE: 'SALE',
    PURCHASE: 'PURCHASE',
    INFO: 'INFO',
    WARNING: 'WARNING',
};

// Leave status
const LEAVE_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

// Expense status
const EXPENSE_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    PAID: 'PAID',
};

// HTTP status codes for consistent usage
const HTTP = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE: 422,
    INTERNAL_ERROR: 500,
};

// Default pagination
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};

module.exports = {
    ROLES,
    ATTENDANCE_STATUS,
    STOCK_MOVEMENT_TYPES,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    NOTIFICATION_TYPES,
    LEAVE_STATUS,
    EXPENSE_STATUS,
    HTTP,
    PAGINATION,
};
