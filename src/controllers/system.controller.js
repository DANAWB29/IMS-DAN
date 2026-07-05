const prisma = require("../prisma");

const healthCheck = async (req, res) => {
    try {
        // Test the database connection
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            success: true,
            message: "API and Database are running.",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database connection failed."
        });
    }
};

module.exports = {
    healthCheck
};