'use strict';

const router = require('express').Router();
const systemController = require('../controllers/system.controller');

router.get('/health', systemController.healthCheck);

module.exports = router;
