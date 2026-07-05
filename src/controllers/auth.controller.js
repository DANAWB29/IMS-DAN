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

module.exports = {
    register,
};