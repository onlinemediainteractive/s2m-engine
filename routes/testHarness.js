/**
 * Created by dfennell on 5/3/16.
 */
var express = require('express');
var stormpath = require('express-stormpath');
var _ = require('lodash');
var request = require('request-promise');
var basicAuth = require('basic-auth');
var router = express.Router();
var mysql = require('promise-mysql');
//var request = require('request');
//var fs = require('fs');
//var onfido = require('../services/api/onfido')
//var mySql = require('../lib/data_store/mysql');
var Applicant = require('../services/model/onfido/applicant_2');

/* GET users listing. */
router.post('/create', stormpath.apiAuthenticationRequired, function(req, res, next) {
    console.log(JSON.stringify(req.headers));
    var user = basicAuth(req);
    console.log(JSON.stringify(user));
  //  var application = mySql.query('Select * from application where apikey_id = ? and apikey_secret = ?',[user.name, user.pass + 'x']);
  //  console.log('sql:' + JSON.stringify(application));

 //   console.log('before complete');
 //   var status = onfido.createApplicant(req.body);
 //   res.send(status);
    var applicant = new  Applicant(req.body);

    var status = applicant.getStatus();
    console.log("status:" + JSON.stringify(status));

    console.log("options:" + JSON.stringify(applicant.getCreateOptions()));
    request(applicant.getCreateOptions())
        .then(function (response) {
            console.log("e err" + JSON.stringify(err));
            res.send(response);
        })
        .catch(function (err) {
            //console.log("e err" + JSON.stringify(err));
           // console.log("e messge" + JSON.stringify(err.name));
           // console.log("e messge" + JSON.stringify(err.statusCode));
           // console.log("e messge" + _.unescape(err.message));
            var eMessage = _.unescape(err.message);
            var n = eMessage.indexOf("{");
            //console.log("index of" + n);
            //console.log('json_str - ' + eMessage.substring( n));
            var mObject =  JSON.parse(eMessage.substring(n));
            console.log("mObject" + JSON.stringify(mObject));
            console.log("e type" + JSON.stringify(mObject.error.type));
            console.log("e messge" + JSON.stringify(mObject.error.message));
           // console.log("e messge" + err.message.message);
            res.res.status(442).send(err);
        })


});



module.exports = router;