var express = require('express');
var stormpath = require('express-stormpath');
var router = express.Router();
var basicAuth = require('basic-auth');
var Application = require('../services/model/s2m/application').Application;
var S2mResponse = require("../lib/common/s2mResponse");

router.all('*', stormpath.apiAuthenticationRequired, function(req, res, next) {
    var apiUser = basicAuth(req);

    Application.verifyApplicationLogin(apiUser.name, apiUser.pass).then(function(s2m2Response) {

        if(s2m2Response.continue()) {
            req.applicationInfo = s2m2Response.getAppInfo();
            next();
        }
        else {
            res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getHttpResponse());
        };
    });
});

router.post('/verify/ssn', function(req, res, next) {

    s2mResponse = {};

    s2mResponse.status  = 'SUCCESS';
    s2mResponse.message = 'SSN Verified';

    res.status(200).send(s2mResponse);
});

router.post('/verify/identity', function(req, res, next) {

    s2mResponse = {};

    s2mResponse.status  = 'SUCCESS';
    s2mResponse.message = 'SSN Verified';

    res.status(200).send(s2mResponse);
});

module.exports = router;




