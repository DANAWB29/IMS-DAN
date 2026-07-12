const admin = (req, res) => {

    res.json({

        success: true,

        message: "Welcome Admin",

        user: req.user

    });

};

module.exports = {
    admin
};