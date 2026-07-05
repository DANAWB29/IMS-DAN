const prisma = require("../prisma");

const findUserByEmail = (email) => {
    return prisma.user.findUnique({
        where: { email },
        include: {
            role: true,
        },
    });
};

const findUserById = (id) => {
    return prisma.user.findUnique({
        where: { id },
        include: {
            role: true,
        },
    });
};

const findRoleByName = (name) => {
    return prisma.role.findUnique({
        where: {
            name,
        },
    });
};

const createUser = (data) => {
    return prisma.user.create({
        data,
        include: {
            role: true,
        },
    });
};

const updateLastLogin = (id) => {
    return prisma.user.update({
        where: { id },
        data: {
            lastLogin: new Date(),
        },
    });
};

module.exports = {
    findUserByEmail,
    findUserById,
    findRoleByName,
    createUser,
    updateLastLogin,
};