const express = require("express");

const router = express.Router();

const authRoutes = require("./auth.routes");

const testRoutes = require("./test.routes");

const adminRoutes = require("./admin.routes");

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Inventory Management System API is running.",
    });
});

router.use("/auth", authRoutes);

router.use("/test", testRoutes);

router.use("/admin", adminRoutes);

module.exports = router;