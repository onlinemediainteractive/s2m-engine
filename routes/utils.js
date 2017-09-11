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


router.all('*', safe2meet.getApplication, safe2meet.continueProcess, function(req, res, next) {
    logger.debug(req.body);
    next();
});



router.get('/refresh/socialToken', safe2meet.refreshSocialToken, function(req, res, next) {
    var i = 1;
    res.status(200).send('Done');
});




module.exports = router;
