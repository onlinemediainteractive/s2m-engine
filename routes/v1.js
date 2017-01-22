//var Promise = require('bluebird');
var express = require('express');
var stormpath = require('express-stormpath');
var _ = require('lodash');
var basicAuth = require('basic-auth');
var router = express.Router();
var safe2meet = require('../lib/controllers/safe2meet');
var S2mResponse = require("../lib/common/s2mHttpResponse");
var logger = require('../lib/helpers/log-helper');

//log incomming request
router.all('*', safe2meet.logRequest, function(req, res, next) {
    req.s2mResponse     = undefined;

    //logger.debug(req.body);
    next();
});

//check stormpath set up 
router.all('*', stormpath.apiAuthenticationRequired, function(req, res, next) {
    logger.debug(req.body);
    next();
});

//validate application has been set up in safe2meet db
router.all('*', safe2meet.getApplication, safe2meet.continueProcess, function(req, res, next) {
    logger.debug(req.body);
    next();
});

//validate there is an applcant ref Id 
router.post('*', safe2meet.getApplicant, safe2meet.continueProcess, function(req, res, next) {
    logger.debug(req.body);
    next();
});

router.post('/verify/identity', safe2meet.applicantState, safe2meet.continueProcess, function(req, res, next) {
    req.subscribeReq = 'no';
    next();
});

router.post('/verify/identity', safe2meet.parseSocialMedia, safe2meet.continueProcess, function(req, res, next) {
    req.identityUdate = false;
    next();
});


// if no successful ssn trace then create applicant
router.post('/verify/identity', safe2meet.createApplicant, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/identity', safe2meet.facebookExtendToken, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/identity', safe2meet.twitterExtendToken, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/identity', safe2meet.linkedinExtendToken, safe2meet.continueProcess, function(req, res, next) {
    next();
});

// if no successful ssn trace and applicant created then run ssn trace
router.post('/verify/identity', safe2meet.ssnTrace, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/identity', safe2meet.verifyIdentity, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/identity', safe2meet.linkedinExtendToken, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/identity', safe2meet.nationalCriminalVerification, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/identity', safe2meet.sexOffenderVerification, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/identity', safe2meet.getApplicant, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/identity', safe2meet.calcScore, safe2meet.continueProcess, function(req, res, next) {
    next();
});


router.get('/verify/getScore/:applicantRefId',  safe2meet.getApplicant, safe2meet.continueProcess, safe2meet.calcScore, safe2meet.continueProcess, function(req, res, next) {
    next();
});


router.post('/verify/update',  safe2meet.updateApplicant , safe2meet.continueProcess, function(req, res, next) {

    req.subscribeReq = 'yes';
    next();

});

router.post('/verify/update', safe2meet.parseSocialMedia, safe2meet.continueProcess, function(req, res, next) {
    req.identityUdate = true;
    var hasSocialMedia = req.socialMediaData || [];
    if (hasSocialMedia.length == 0 ) {
        account = {};
        account.attributes = {};
        account.attributes.accessToken = 'extendCheck';
        account.attributes.userId = 'me';
        req.socialMediaData = [];
        req.socialMediaData.push({"source" : 'facebook', "attributes" : account});
    }
    next();
});

router.post('/verify/update', safe2meet.facebookExtendToken, safe2meet.continueProcess, function(req, res, next) {
    next();
 });

router.post('/verify/update', safe2meet.twitterExtendToken, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/update', safe2meet.linkedinExtendToken, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/update', safe2meet.nationalCriminalVerification, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/update', safe2meet.sexOffenderVerification, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/update', safe2meet.calcScore, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/update',  safe2meet.updateApplicant , safe2meet.continueProcess, function(req, res, next) {

    next();

});

router.post('/verify/refresh', safe2meet.parseSocialMedia, safe2meet.continueProcess, function(req, res, next) {
    req.subscribeReq = 'no';
    req.identityUdate = true;
    var hasSocialMedia = req.socialMediaData || [];
    if (hasSocialMedia.length == 0 ) {
        account = {};
        account.attributes = {};
        account.attributes.accessToken = 'extendCheck';
        account.attributes.userId = 'me';
        req.socialMediaData = [];
        req.socialMediaData.push({"source" : 'facebook', "attributes" : account});
    }
    next();
});

router.post('/verify/refresh', safe2meet.facebookExtendToken, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/refresh', safe2meet.twitterExtendToken, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/refresh', safe2meet.linkedinExtendToken, safe2meet.continueProcess, function(req, res, next) {
    next();
});

router.post('/verify/refresh', safe2meet.calcScore, safe2meet.continueProcess, function(req, res, next) {
    next();
});



router.get('/verify/scoreTrace/:applicantRefId', safe2meet.getApplicant, safe2meet.continueProcess, safe2meet.calcScore, function(req, res, next) {
//router.get('/verify/scoreTrace/:applicantId', function(req, res, next) {

    var i = 1;
    res.status(200).send(req.scoreTrace);
});


module.exports = router;
