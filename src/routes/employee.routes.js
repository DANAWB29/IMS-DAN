'use strict';

const router = require('express').Router();
const employeeController = require('../controllers/employee.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const ev = require('../validators/employee.validator');
const av = require('../validators/attendance.validator');
const { ROLES } = require('../constants');

router.use(authenticate);

// ── Employee CRUD (ADMIN only for write, both can read) ──────

router.get('/',
    validate(ev.listEmployees),
    employeeController.listEmployees
);

router.get('/:id',
    validate(ev.getById),
    employeeController.getEmployeeById
);

router.post('/',
    authorize(ROLES.ADMIN),
    validate(ev.createEmployee),
    employeeController.createEmployee
);

router.patch('/:id',
    authorize(ROLES.ADMIN),
    validate(ev.updateEmployee),
    employeeController.updateEmployee
);

router.delete('/:id',
    authorize(ROLES.ADMIN),
    validate(ev.getById),
    employeeController.deleteEmployee
);

// ── Attendance Summary ────────────────────────────────────────

router.get('/:id/attendance/summary',
    validate(ev.getById),
    employeeController.getAttendanceSummary
);

// ── Attendance CRUD ──────────────────────────────────────────

router.get('/attendance/all',
    validate(av.listAttendance),
    employeeController.listAttendance
);

router.get('/attendance/:id',
    validate(av.getById),
    employeeController.getAttendanceById
);

router.post('/attendance/check-in',
    validate(av.checkIn),
    employeeController.checkIn
);

router.post('/attendance/check-out',
    validate(av.checkOut),
    employeeController.checkOut
);

router.post('/attendance/mark',
    authorize(ROLES.ADMIN),
    validate(av.markAttendance),
    employeeController.markAttendance
);

router.patch('/attendance/:id',
    authorize(ROLES.ADMIN),
    validate(av.updateAttendance),
    employeeController.updateAttendance
);

router.delete('/attendance/:id',
    authorize(ROLES.ADMIN),
    validate(av.getById),
    employeeController.deleteAttendance
);

module.exports = router;
