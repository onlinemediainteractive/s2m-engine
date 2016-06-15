var _ = require('lodash');
var S2mResponse = require('../common/s2mHttpResponse');
var logger = require('../helpers/log-helper');


function getSsnTracePoints(applicantTransaction) {

    var availablePoints = 20;

    if(applicantTransaction.ssnTraceRequired()) {
        availablePoints = availablePoints - 20;
    };

    return availablePoints;

};

function getIdentityVarificationPoints(applicantTransaction) {
    var availablePoints = 20;
   
    if(applicantTransaction.quizRequired()) {
        availablePoints = availablePoints - 20;
    }
    else {
        var attempts = applicantTransaction.getQuestionAttempts();
        if(attempts >= 2) {
            availablePoints = availablePoints - 10;
        };
    };


    return availablePoints;
};


function getCriminalPoints(applicantTransaction) {
    var availablePoints = 20;
    
    if(applicantTransaction.sexOffenderVerificationRequired() || applicantTransaction.nationalCriminalVerificationRequired()) {
        availablePoints = availablePoints - 20;
    }
    else {
    //    var breakdown = applicantTransaction.getSexOffenderVerification().breakdown;
    //   if(breakdown)
    }
    

    return availablePoints;
};


module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    console.log(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        req.s2mResponse = new S2mResponse('INTERNAL_ERR_NO_TRANSACTION');
        logger.debug(scriptName + ' Continue ....');
        next();

    };
    var score      = 0;
    var stepPoints = 0;

    stepPoints =  getSsnTracePoints(applicantTransaction);
    score      = score + stepPoints;
    logger.debug(' -- ' + 'SSN Trace - Step(1) Points = ' + stepPoints + ' Running Score = ' + score);


    stepPoints = getIdentityVarificationPoints(applicantTransaction);
    score      = score + stepPoints;
    logger.debug(' -- ' + 'Identity Varification - Step(2) Points = ' + stepPoints + ' Running Score = ' + score);



    logger.debug(scriptName + ' Continue ....');
    next();
}
