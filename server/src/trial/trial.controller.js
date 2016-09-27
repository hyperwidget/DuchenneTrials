'use strict';

var Trial = require('./trial.model');
var request = require('request');
var fs = require('fs');
var AdmZip = require('adm-zip');
var xml2js = require('xml2js');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/duchenne-trials-dev';
var assert = require('assert');
var BSON = require('bson').BSONPure

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
      },

    ]
  };
  if (params.exon_53 === 'true') {
    terms.$and.push({ exon_53: true });
  }

  if (params.exon_51 === 'true') {
    terms.$and.push({ exon_51: true });
  }

  if (params.exon_49 === 'true') {
    terms.$and.push({ exon_49: true });
  }

  return terms;
}

/**
 * GET /trials/:id
 *
 * @description
 * Find trial by id
 *
 */
exports.get = function (req, res) {
  MongoClient.connect(url, function (err, db) {
    if (req.params.id.length === 24) {
      db.collection('trials').findOne({ _id: new BSON.ObjectID(req.params.id) }, function (err, trial) {
        if (err) {
          return res.status(404).send('Not Found');
        } else {
          return res.status(200).json(trial);
        }
      });
    } else {
      return res.status(404).send('Not Found');
    }
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
              var trial = applyMutations(result.clinical_study);
              db.collection('trials').insertOne(trial, function (err) {
                if (err !== null) {
                  console.log(err);
                  console.log(trial);
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

function applyMutations(trial) {
  var mutations = {};

  if (trial.brief_summary.textblock.indexOf('exon 53') > -1) {
    mutations.exon_53 = true;
  }

  if (trial.brief_summary.textblock.indexOf('exon 51') > -1) {
    mutations.exon_51 = true;
  }

  if (trial.brief_summary.textblock.indexOf('exon 49') > -1) {
    mutations.exon_49 = true;
  }

  return Object.assign(trial, mutations);
}

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
