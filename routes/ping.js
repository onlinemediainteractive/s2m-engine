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


router.post('/verify/ping',  function(req, res, next) {
    var s2mResponse = new S2mResponse('SUCCESS_PING_POST');
    res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getResponse());
});

router.get('/verify/ping',  function(req, res, next) {
    var s2mResponse = new S2mResponse('SUCCESS_PING_GET');
    res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getResponse());
});


module.exports = router;
