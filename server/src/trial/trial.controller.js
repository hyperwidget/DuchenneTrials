'use strict';

var Trial = require('./trial.model');
var request = require('request');
var fs = require('fs');
var AdmZip = require('adm-zip');
var xml2js = require('xml2js');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/duchenne-trials-dev';
var assert = require('assert');


// var unzip = require('unzip');
// var path = require('path');

/**
 * GET /trials
 *
 * @description
 * list of trials
 *
 */
exports.find = function (req, res) {
  MongoClient.connect(url, function (err, db) {
    var cursor = db.collection('trials').find(getSearchTerms(req.query)).limit(20);
    var response = [];
    cursor.each(function (err, doc) {
      assert.equal(err, null);
      if (doc != null) {
        response.push(doc);
      } else {
        db.close();
        return res.status(200).json(response);
      }
    });
  });
};

function getSearchTerms(params) {
  var terms = {
    $and: [{
      $or: [
        { official_title: new RegExp(params.search, 'i') },
        { 'brief_summary.textblock': new RegExp(params.search, 'i') }
      ]
    },
      {
        $or: [
          { 'location.facility.address.city': new RegExp(params.location, 'i') },
          { 'location.facility.address.state': new RegExp(params.location, 'i') }
        ]
      }]
  };
  return terms;
}

/**
 * GET /trials/:id
 *
 * @description
 * Find trial by id
 *
 */
exports.get = function (req, res, next) {
  Trial.findById(req.params.id, function (err, trial) {
    if (err) {
      return next(err);
    }
    if (!trial) {
      return res.status(404).send('Not Found');
    }
    return res.status(200).json(trial);
  });
};

/**
 * POST /trials
 *
 * @description
 * Create a new trial
 *
 */
exports.post = function (req, res) {
  request.get('http://clinicaltrials.gov/ct2/results?term=dmd&recr=Open&resultsxml=true&page=1')
    .pipe(fs.createWriteStream('./tmp/bootstrap.zip'))
    .on('close', function () {
      var parser = new xml2js.Parser({ ignoreAttrs: true, explicitArray: false, trim: true });
      var zip = new AdmZip("./tmp/bootstrap.zip");
      zip.extractAllTo(/*target path*/"./tmp/files/", /*overwrite*/true);

      fs.readdir('./tmp/files', function (err, filenames) {
        MongoClient.connect(url, function (err, db) {
          db.collection('trials').remove();
          filenames.forEach(function (filename) {
            var content = fs.readFileSync('./tmp/files/' + filename).toString();
            parser.parseString(content, function (err, result) {
              db.collection('trials').insertOne(result.clinical_study, function (err) {
                if (err !== null) {
                  console.log(err);
                  console.log(result.clinical_study);
                }
              });
            });
          });
          db.close();
          return res.status(200).json();
        });
      });
    });
};

/**
 * PUT /trials/:id
 *
 * @description
 * Update a trial
 *
 */
exports.put = function (req, res, next) {
  Trial.findById(req.params.id, function (err, trial) {
    if (err) {
      return next(err);
    }
    if (!trial) {
      return res.status(404).send('Not Found');
    }

    trial.name = req.body.name;
    trial.description = req.body.description;

    trial.save(function (err) {
      if (err) {
        return next(err);
      }
      return res.status(200).json(trial);
    });
  });
};
