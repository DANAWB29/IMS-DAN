const bcrypt = require("bcrypt");

const {
    findUserByEmail,
    findRoleByName,
    createUser,
    updateLastLogin,
} = require("../repositories/auth.repository");

const { generateToken } = require("../utils/jwt");

const register = async (userData) => {
    const { fullName, email, password, role } = userData;

    // Validation
    if (!fullName || !email || !password || !role) {
        throw new Error("All fields are required");
    }

    if (fullName.trim().length < 3) {
        throw new Error("Full name must be at least 3 characters.");
    }

    if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
        throw new Error("Email already exists.");
    }

    const userRole = await findRoleByName(role.toUpperCase());

    if (!userRole) {
        throw new Error("Invalid role.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
        fullName,
        email: normalizedEmail,
        password: hashedPassword,
        roleId: userRole.id,
    });

    const token = generateToken(user);

    const { password: _, ...safeUser } = user;

    return {
        token,
        user: safeUser,
    };
};

const login = async ({ email, password }) => {

    if (!email || !password) {
        throw new Error("Email and password are required.");
    }

    const user = await findUserByEmail(email.toLowerCase().trim());

    if (!user) {
        throw new Error("Invalid email or password.");
    }

    if (!user.isActive) {
        throw new Error("Account has been disabled.");
    }

    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatch) {
        throw new Error("Invalid email or password.");
    }

    await updateLastLogin(user.id);

    const token = generateToken(user);

    const { password: _, ...safeUser } = user;

    return {
        token,
        user: safeUser,
    };
};

module.exports = {
    register,
    login,
};