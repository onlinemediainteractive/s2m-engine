var express = require('express');
var router = express.Router();
var S2mResponse = require("../lib/common/s2mHttpResponse");


router.get('/ping', function(req, res, next) {
    var s2mResponse = new S2mResponse('SUCCESS_PING');
    res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getHttpResponse());
});

module.exports = router;
