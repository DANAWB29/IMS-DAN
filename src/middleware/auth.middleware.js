const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

module.exports = async (req, res, next) => {

    try {

        const header = req.headers.authorization;

        if (!header)
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        const token = header.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            },
            include: {
                role: true
            }
        });

        if (!user)
            return res.status(401).json({
                success: false,
                message: "User not found"
            });

        req.user = user;

        next();

    } catch (err) {

        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });

    }

};