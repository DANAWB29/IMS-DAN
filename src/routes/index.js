const express = require("express");

const router = express.Router();

const authRoutes = require("./auth.routes");

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Inventory Management System API is running.",
    });
});

router.use("/auth", authRoutes);

module.exports = router;