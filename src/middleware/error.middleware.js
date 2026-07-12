const AppError = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {

    console.error(err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });

};

module.exports = errorHandler;