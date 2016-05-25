var express = require('express');
var stormpath = require('express-stormpath');

router.all('*', stormpath.apiAuthenticationRequired, function(req, res, next) {
  next();
});

router.post('/verify/ssn', stormpath.apiAuthenticationRequired, function(req, res, next) {

    s2mResponse = {};

    s2mResponse.status  = 'SUCCESS';
    s2mResponse.message = 'SSN Verified';

    res.status(200).send(s2mResponse);
});

module.exports = router;




