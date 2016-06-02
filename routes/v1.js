var Promise = require('bluebird');
var express = require('express');
var stormpath = require('express-stormpath');
var _ = require('lodash');
var request = require('request-promise');
var basicAuth = require('basic-auth');
var router = express.Router();
var applicant = require('../services/model/onfido/applicant');

//var Applicant = Promise.promisifyAll(require('../services/model/onfido/applicant'));

var application = require('../services/model/s2m/application').Application;
var identityQuiz = require('../services/model/lexisnexis/identityQuiz');
var S2mResponse = require("../lib/common/s2mResponse");

var VerifyIdentity = require("../services/controllers/verifyIdentity");

Promise.promisifyAll(VerifyIdentity.prototype);

var using = Promise.using;

router.all('*', stormpath.apiAuthenticationRequired, function(req, res, next) {

    var apiUser = basicAuth(req);

    application.verifyApplicationLogin(apiUser.name, apiUser.pass).then(function(s2m2Response) {

      if(s2m2Response.continue()) {
          req.applicationInfo = s2m2Response.getAppInfo();
          next();
      }
      else {
          res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getHttpResponse());
      };
    });

});


router.post('/verify/identity',  function(req, res, next) {

    //applicant.processFlow2Async(req.body, req.applicationInfo).then(function(s2mresponse) {
    //    console.log(s2mresponse);
    //    res.send('xxxxxxx');
    //});
    
    var id = new VerifyIdentity(req.applicationInfo, req.body);
    id.processAsync().then(function(response){
        console.log('Response Body :' + JSON.stringify(response.getHttpResponse()));
        if(!_.isNil(response.getObject('testResponse'))) {
            console.log('Test Response : ' + JSON.stringify(response.getObject('testResponse')));
        }

        res.status(response.getHttpStatusCode()).send(response.getHttpResponse());
    });
    //console.log('before rend');
    //res.send('new process');
    //res.status(response.getHttpStatusCode()).send(response.getHttpResponse());

       // .this(function(s2mresponse) {
       // res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getHttpResponse());

        //return;
    //});

});

router.post('/verify/ssn',  function(req, res, next) {

    var validationResponse = applicant.validateRequestParams(req.body);
    if(! validationResponse.continue()) {
        res.status(validationResponse.getHttpStatusCode()).send(validationResponse.getHttpResponse());
    }
    else {
        req.body.emailAlias    = Date.now() + '.' + req.body.email;
        applicant.processFlow(req.body, req.applicationInfo).then(function(s2mResponse) {
            //console.log(JSON.stringify(s2mResponse));
            res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getHttpResponse());
        });
    };
});

router.post('/verify/identityx',  function(req, res, next) {

    identityQuiz.beginQuiz(req.body).then(function(identityResponse){
        console.log('Transaction Id: ' + JSON.stringify(identityResponse.transactionId));
        console.log('Test response : ' + JSON.stringify(identityResponse.testResponse));
        res.status(200).send(identityResponse);
    });

});


router.put('/verify/identity/:transaction_id',  function(req, res, next) {
    var args = req.body;
    args.transactionId = req.params.transaction_id;
    var testresponse = identityQuiz.continueQuiz(args).then(function(identityResponse) {

        console.log(identityResponse);
        res.status(200).send('LN continue');
    });



});

router.get('/verify/list',  function(req, res, next) {

    var id = '9d98e871-8a1e-40b9-8867-a203afbe99de';
    applicant.findx(id).then(function(resultfind) {

        console.log('result resultSsnTrace' + JSON.stringify(resultfind));

        res.status(200).send(resultfind);
    });

});

router.get('/verify/ping',  function(req, res, next) {

    var s2mResponse = new S2mResponse();
    s2mResponse.setHttpResponse('SUCCESS_PING');
    res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getHttpResponse());
});

module.exports = router;