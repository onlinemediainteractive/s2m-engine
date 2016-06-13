var _ = require('lodash');
var S2mResponse = require('../common/s2mHttpResponse');

calcScore = function(ssn) {

    var score = 0;


    var key = ssn.substring(1, 0);
    if (key == '1') {
        score = 300;
    }
    if (key == '2') {
        score = 740;
    }
    if (key == '3') {
        score = 790;
    }
    if (key == '4') {
        score = 800;
    }
    if (key == '5') {
        score = 825;
    }
    if (key == '6') {
        score = 850;
    }
    if (key == '7') {
        score = 400;
    }
    if (key == '8') {
        score = 450;
    }
    if (key == '9') {
        score = 500;
    }
    if (key == '0') {
        score = 200;
    }

    if(score == 0) {
        score = 100;
    };


    var response = new S2mResponse('SUCCESS_SCORE', {"score" : score});
    return response;
};

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    console.log(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        req.s2mResponse = new S2mResponse('INTERNAL_ERR_NO_TRANSACTION');
        console.log(scriptName + ' Continue ....');
        next();

    };

    req.s2mResponse = calcScore(req.applicantTransaction.getSsn());
    console.log(scriptName + ' Continue ....');
    next();
}
