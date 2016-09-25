'use strict';

var express = require('express');
var router = express.Router();

var trial = require('./trial/trial.controller');

// trials resources
router.get('/api/trials', trial.find);
router.get('/api/trials/:id', trial.get);
router.post('/api/trials/refresh', trial.post);
router.put('/api/trials/:id', trial.put);

module.exports = router;
