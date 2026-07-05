const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth.middleware");

const authorize = require("../middleware/role.middleware");

const testController = require("../controllers/test.controller");

router.get(

    "/admin",

    auth,

    authorize("ADMIN"),

    testController.admin

);

module.exports = router;