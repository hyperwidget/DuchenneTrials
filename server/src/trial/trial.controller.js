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
var tmpFilesDir = './tmp/files';
var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport 
var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL 
  auth: {
    user: 'rawkamatic@gmail.com',
    pass: 'fvoghtoflvbpsemm'
  }
});

/**
 * GET /trials
 *
 * @description
 * list of trials
 *
 */
exports.find = function (req, res) {
  var page = parseInt(req.query.page) - 1 || 0;
  var limit = parseInt(req.query.limit) || 10;
  MongoClient.connect(url, function (err, db) {
    var response = { trials: [] };
    db.collection('trials').find(getSearchTerms(req.query)).count({}, function (err, count) {
      response.total = count;
      var cursor = db.collection('trials').find(getSearchTerms(req.query)).skip(page * limit).limit(limit);
      cursor.each(function (err, doc) {
        assert.equal(err, null);
        if (doc != null) {
          response.trials.push(doc);
        } else {
          db.close();
          return res.status(200).json(response);
        }
      });
    });
  });
};

function getSearchTerms(params) {
  var terms = { $and: [] };

  // Text Search terms
  if (params.search) {
    terms.$and.push(
      {
        $or: [
          { official_title: new RegExp(params.search, 'i') },
          { 'brief_summary.textblock': new RegExp(params.search, 'i') },
          { 'source': new RegExp(params.search, 'i') }
        ]
      }
    )
  }

  // Location search terms
  if (params.location) {
    terms.$and.push(
      {
        $or: [
          { 'location.facility.address.city': new RegExp(params.location, 'i') },
          { 'location.facility.address.country': new RegExp(params.location, 'i') },
          { 'location.facility.address.state': new RegExp(params.location, 'i') }
        ]
      }
    )
  }

  // Params for age search 
  if (params.age) {
    terms.$and.push(
      // Age search terms
      {
        "minimum_age": { "$lte": parseInt(params.age) },
        "maximum_age": { "$gte": parseInt(params.age) }
      }
    )
  }

  // Params for seaching mutation
  if (params.exon_53 === 'true') {
    terms.$and.push({ exon_53: true });
  }

  if (params.exon_51 === 'true') {
    terms.$and.push({ exon_51: true });
  }

  if (params.exon_49 === 'true') {
    terms.$and.push({ exon_49: true });
  }

  // Params for searching study_type
  if (params.study_type) {
    var study_types = JSON.parse(params.study_type);
    var search_studies = [];
    for (var type in study_types) {
      if (study_types[type]) {
        if (type === "patient_registry") {
          search_studies.push("Observational [Patient Registry]");
        } else if (type === "expanded_access") {
          search_studies.push("Expanded Access");
        } else {
          search_studies.push(type.charAt(0).toUpperCase() + type.slice(1));
        }
      }
    }

    if (search_studies.length > 0) {
      terms.$and.push({ study_type: { $in: search_studies } });
    }
  }

  return terms.$and.length > 0 ? terms : {};
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
  console.log('refresh');
  clearTmpFiles();

  request.get('http://clinicaltrials.gov/ct2/results?term=dmd&recr=Open&resultsxml=true')
    .pipe(fs.createWriteStream('./tmp/bootstrap.zip'))
    .on('close', function () {
      var parser = new xml2js.Parser({ ignoreAttrs: true, explicitArray: false, trim: true });
      var zip = new AdmZip("./tmp/bootstrap.zip");
      zip.extractAllTo(/*target path*/tmpFilesDir, /*overwrite*/true);

      fs.readdir('./tmp/files', function (err, filenames) {
        MongoClient.connect(url, function (err, db) {
          db.collection('trials').remove();
          filenames.forEach(function (filename) {
            var content = fs.readFileSync(tmpFilesDir + "/" + filename).toString();
            parser.parseString(content, function (err, result) {
              var trial = applyMutations(result.clinical_study);
              trial = applyLastLocalUpdate(trial);
              trial = applyAges(trial);
              db.collection('trials').insertOne(trial, function (err) {
                if (err !== null) {
                  console.log(err);
                  console.log(trial);
                }
              });
            });
          });
          db.close();
          sendEmailUpdate('DATABASE REFRESHED; ' + filenames.length + ' records in database.');
          return res.status(200).json();
        });
      });
    });
};

function applyLastLocalUpdate(trial) {
  return Object.assign(trial, { lastLocalUpdate: new Date().toLocaleString() });
}

function applyMutations(trial) {
  var mutations = [];

  if (trial.brief_summary.textblock.indexOf('exon 53') > -1) {
    mutations.exon_53 = true;
  }

  if (trial.brief_summary.textblock.indexOf('exon 51') > -1) {
    mutations.exon_51 = true;
  }

  if (trial.brief_summary.textblock.indexOf('exon 49') > -1) {
    mutations.exon_49 = true;
  }

  return Object.assign(trial, { mutations: mutations });
}

function applyAges(trial) {
  var ages = {};

  if (trial.eligibility.minimum_age === "N/A") {
    ages.minimum_age = 0
  } else {
    ages.minimum_age = parseInt(trial.eligibility.minimum_age.split(' ')[0]);
  }

  if (trial.eligibility.maximum_age === "N/A") {
    ages.maximum_age = 200;
  } else {
    ages.maximum_age = parseInt(trial.eligibility.maximum_age.split(' ')[0]);
  }

  return Object.assign(trial, ages);
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
}

function clearTmpFiles() {
  if (fs.existsSync(tmpFilesDir)) {
    fs.readdirSync(tmpFilesDir).forEach(function (file) {
      var curPath = tmpFilesDir + "/" + file;
      fs.unlinkSync(curPath);
    });
  }
  if (fs.existsSync('./tmp/bootstrap.zip')) {
    fs.unlinkSync('./tmp/bootstrap.zip');
  }
}

exports.getUpdates = function (req, res) {
  console.log('updates');
  clearTmpFiles();
  var d = new Date();
  d.setDate(d.getDate() - 1);
  var searchDate = ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + "/" + d.getFullYear()
  request.get('http://clinicaltrials.gov/ct2/results?term=dmd&recr=Open&resultsxml=true&lup_s=' + searchDate)
    .pipe(fs.createWriteStream('./tmp/bootstrap.zip'))
    .on('close', function () {
      var parser = new xml2js.Parser({ ignoreAttrs: true, explicitArray: false, trim: true });
      try {
        var zip = new AdmZip("./tmp/bootstrap.zip");
        zip.extractAllTo(/*target path*/tmpFilesDir, /*overwrite*/true);
        fs.readdir(tmpFilesDir, function (err, filenames) {
          MongoClient.connect(url, function (err, db) {
            filenames.forEach(function (filename) {
              var content = fs.readFileSync(tmpFilesDir + '/' + filename).toString();
              parser.parseString(content, function (err, result) {
                var trial = applyMutations(result.clinical_study);
                trial = applyLastLocalUpdate(trial);
                trial = applyAges(trial);
                db.collection('trials').update({ 'id_info.nct_id': trial.id_info.nct_id }, trial, { upsert: true }, function (err) {
                  if (err !== null) {
                    console.log(err);
                    console.log(trial);
                  }
                });
              });
            });
            sendEmailUpdate('Update pulled; ' + filenames.length + ' records changed.');
            db.close();
            return res.status(200).json();
          });
        });
      } catch (except) {
        console.log(except);
        sendEmailUpdate('Update pulled; issue unzipping; no records changed');
        return res.status(200).json();
      }
    });
};

function sendEmailUpdate(message) {
  console.log(message);
  var mailOptions = {
    from: '"Duchenne Trials" <rawkamatic@gmail.com>', // sender address 
    to: 'rawkamatic@gmail.com', // list of receivers 
    subject: 'There was an update', // Subject line 
    text: message, // plaintext body 
    html: message // html body 
  };

  // send mail with defined transport object 
  transporter.sendMail(mailOptions, function (error) {
    if (error) {
      return console.log(error);
    }
  });
}