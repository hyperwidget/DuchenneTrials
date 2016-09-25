'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrialSchema = new Schema({}, {strict: false});

module.exports = mongoose.model('Trial', TrialSchema);
