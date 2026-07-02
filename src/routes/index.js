const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        succes: true,
        message: "Inventory Mnaagement System API"
    });
});

module.exports = router;