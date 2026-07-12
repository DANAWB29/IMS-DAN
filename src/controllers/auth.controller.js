const authService = require("../services/auth.service");

const register = async (req, res, next) => {
    try {
        console.log("Request Body:", req.body);

        const result = await authService.register(req.body);

        res.status(201).json({
            success: true,
            message: "User registered successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {

    try {

        const result = await authService.login(req.body);

        res.json({
            success: true,
            message: "Login successful.",
            data: result,
        });

    } catch (error) {

        next(error);

    }

};

const me = async (req, res) => {

    const { password, ...user } = req.user;

    res.json({
        success: true,
        data: user
    });

};

module.exports = {
    register,
    login,
    me
};