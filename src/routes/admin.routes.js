const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth.middleware");

const authorize = require("../middleware/role.middleware");

router.get(

    "/dashboard",

    auth,

    authorize("ADMIN"),

    (req, res) => {

        res.json({

            success: true,

            message: "Welcome Admin",

            user: req.user

        });

    }

);

module.exports = router;