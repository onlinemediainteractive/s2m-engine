var express = require('express');
var router = express.Router();

router.all('*', function(req, res, next) {

    res.send('ok');
});

module.exports = router;
