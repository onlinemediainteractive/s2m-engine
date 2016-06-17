//var Promise = require('bluebird');
var express = require('express');
var stormpath = require('express-stormpath');
var _ = require('lodash');
var basicAuth = require('basic-auth');
var router = express.Router();
var safe2meet = require('../lib/controllers/safe2meet');

//log incomming request
router.all('*', safe2meet.logRequest, function(req, res, next) {

    req.s2mResponse     = undefined;
    req.performedSteps  = {};
    req.performedSteps.ssn_trace             = "no";
    req.performedSteps.sex_offender_check    = "no";
    req.performedSteps.national_crime_check  = "no";
    req.performedSteps.facebook_verification = "no";

    next();
});

//check stormpath set up 
router.all('*', stormpath.apiAuthenticationRequired, function(req, res, next) {

    next();
});


//validate application has been set up in safe2meet db
router.all('*', safe2meet.getApplication, safe2meet.continueProcess, function(req, res, next) {
    next();
});

//validate there is an applcant ref Id 
router.all('*', safe2meet.getApplicant, safe2meet.continueProcess, function(req, res, next) {
    next();
});


router.post('/verify/identity', safe2meet.applicantState, safe2meet.continueProcess, function(req, res, next) {
    next();
});

// if no successful ssn trace then create applicant
router.post('/verify/identity', safe2meet.createApplicant, safe2meet.continueProcess, function(req, res, next) {
    next();
});

// if no successful ssn trace and applicant created then run ssn trace
router.post('/verify/identity', safe2meet.ssnTrace, safe2meet.continueProcess, function(req, res, next) {
    next();
});


router.post('/verify/identity', safe2meet.verifyIdentity, safe2meet.continueProcess, function(req, res, next) {
    next();
});


router.post('/verify/identity', safe2meet.sexOffenderVerification, safe2meet.continueProcess, function(req, res, next) {
    next();
});


router.post('/verify/identity', safe2meet.nationalCriminalVerification, safe2meet.continueProcess, function(req, res, next) {
    next();
});



//router.post('/verify/identity', safe2meet.getApplicant, safe2meet.calcScore, safe2meet.continueProcess, function(req, res, next) {
//    next();
//});


router.post('/verify/identity', safe2meet.getApplicant, safe2meet.getScoreMock, safe2meet.continueProcess, function(req, res, next) {
    next();
});







router.get('/verify/ping',  function(req, res, next) {

    var s2mResponse = new S2mResponse('SUCCESS_PING');
    res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getHttpResponse());
});


router.get('/verify/getScore/:applicantId',  function(req, res, next) {

    var s2mResponse = new S2mResponse('SUCCESS_PING');
    res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getHttpResponse());
});

module.exports = router;
