var express = require('express');
var stormpath = require('express-stormpath');
var router = express.Router();
var S2mResponse = require("../lib/common/s2mHttpResponse");
//var facebook = require("../lib/middleware/facebook-test");
//var passport = require('passport');
//var FacebookTokenStrategy = require('passport-facebook-token');


//router.get('/', function(req, res, next) {
//    var x = reg.session;
//    var s2mResponse = new S2mResponse('SUCCESS_PING');
//    res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getResponse());
//});


//router.get('/', stormpath.loginRequired,  function(req, res){
//    next();
//});

router.get('/fb/redirect', function(req, res, next) {

    next();
});


//router.get('/ping', function(req, res, next) {
//    var s2mResponse = new S2mResponse('SUCCESS_PING');
//    res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getResponse());
//});

//router.get('/verify/social/facebook', function(req, res, next) {


 //   var s2mResponse = new S2mResponse('SUCCESS_PING');
 //   res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getResponse());
//});


router.get('/500Error', function(req, res, next) {

    console.log('500 Error 1');
    var x = req.xxxx.y;
    console.log('500 Error 2');
});

module.exports = router;
