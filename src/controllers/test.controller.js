'use strict';

// Health/test endpoint for development only
const admin = (req, res) => {
    res.json({
        success: true,
        message: 'Admin test route is working.',
        user: req.user,
    });
};

module.exports = { admin };
