var express = require('express');
var router = express.Router();
var S2mResponse = require("../lib/common/s2mResponse");

/* GET home page. */
router.get('/ping', function(req, res, next) {
  //res.render('index', { title: 'Express' });
    var s2mResponse = new S2mResponse();
    s2mResponse.setHttpResponse('SUCCESS_PING');
    res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getHttpResponse());
});

module.exports = router;
