const express = require("express");
const router = express.Router();

const { healthCheck } = require("../controllers/system.controller");

router.get("/health", healthCheck);

module.exports = router;