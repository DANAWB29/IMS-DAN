module.exports = (...roles) => {

    return (req, res, next) => {

        if (!roles.includes(req.user.role.name)) {

            return res.status(403).json({

                success: false,

                message: "Access denied"

            });

        }

        next();

    };

};