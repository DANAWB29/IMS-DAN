'use strict';

const prisma = require('../prisma');

const findAll = ({ skip, take, where, orderBy }) =>
    prisma.user.findMany({
        where: { isDeleted: false, ...where },
        include: { role: true },
        skip,
        take,
        orderBy,
    });

const count = (where = {}) =>
    prisma.user.count({ where: { isDeleted: false, ...where } });

const findById = (id) =>
    prisma.user.findUnique({
        where: { id, isDeleted: false },
        include: { role: true },
    });

const findByEmail = (email) =>
    prisma.user.findUnique({
        where: { email, isDeleted: false },
        include: { role: true },
    });

const update = (id, data) =>
    prisma.user.update({
        where: { id },
        data,
        include: { role: true },
    });

const softDelete = (id) =>
    prisma.user.update({
        where: { id },
        data: { isDeleted: true, isActive: false },
    });

const findRoleByName = (name) =>
    prisma.role.findUnique({ where: { name } });

const findAllRoles = () =>
    prisma.role.findMany();

module.exports = {
    findAll,
    count,
    findById,
    findByEmail,
    update,
    softDelete,
    findRoleByName,
    findAllRoles,
};
