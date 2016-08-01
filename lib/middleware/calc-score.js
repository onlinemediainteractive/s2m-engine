var _ = require('lodash');
var S2mResponse = require('../common/s2mHttpResponse');
var logger = require('../helpers/log-helper');
var config = require('config');
var socialMediaConfig = config.get('SocialMedia');
var socialMediaHelper = require("../helpers/social-media-helper");
var Promise = require('bluebird');
var using = Promise.using;

function scoreCanBeCalulated(applicantTransaction) {
    var response = {}
    response.scoreCanBeCalulated = true;
    response.message = [];

    if(applicantTransaction.ssnTraceRequired()) {
        response = false;
        response.message.push('SSN Trace not completed');
    }

    if(applicantTransaction.quizRequired()) {
        response = false;
        response.message.push('Identity Quize Not completed');
    }
    if(applicantTransaction.sexOffenderVerificationRequired() || applicantTransaction.nationalCriminalVerificationRequired()) {
        response = false;
        response.message.push('Criminal Background Check not comptetd ');
    }

    return response;
}
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
         var sexOffender = applicantTransaction.getSexOffenderVerification().serviceResponse;
         logger.debug('sex_offender' + JSON.stringify(sexOffender));

         if(sexOffender.result !== "clear") {
            var breakdown = sexOffender.breakdown;
            logger.debug('sex_offender breakdown' + JSON.stringify(breakdown));
            if((breakdown.full_name.result == 'consider') && (breakdown.address.result == 'consider') && (breakdown.age.result == 'consider')) {
                availablePoints = availablePoints - 20;
            }
            else {
                availablePoints = availablePoints - 5;
            };
         }
         else {
             logger.debug('Sex Offender result is clear');
         };

         var nationalCriminal = applicantTransaction.getNationalCriminalVerification().serviceResponse;
         logger.debug('national_criminal' + JSON.stringify(nationalCriminal));

         if(nationalCriminal.result !== "clear") {
            var records = nationalCriminal.properties.records || [];
            if(records.length == 0) {
               availablePoints = availablePoints - 5;
            }
            else {
                var misdemeanorCnt = 0;
                var felonyCnt      = 0;
                var otherCnt       = 0;
                var offenses       = {};
                _.forEach(records, function(record) {
                  logger.debug('record : ' + JSON.stringify(record));
                  offenses = record.offenses;
                    var plea = {};
                    var disposition = {};
                    var caseType = {};
                  _.forEach(offenses, function(offense) {
                     // logger.debug('offense: ' + JSON.stringify(offense));
                      caseType = offense.case_type || 'OTHER';
                      plea = offense.plea || 'NOT GUILTY';
                      disposition = offense.disposition || 'NOT GUILTY';
                      if((plea == 'GUILTY') || (disposition == 'GUILTY')) {
                          if(caseType.toString().toUpperCase().indexOf('MISDEMEANOR') >= 0) {
                              misdemeanorCnt ++;
                          }
                          else if(caseType.toString().toUpperCase().indexOf('FELONY') >= 0) {
                              felonyCnt ++;
                          }
                          else {
                              otherCnt ++;
                          };
                      };
                  });
                });
                if(felonyCnt > 0) {
                    availablePoints = availablePoints - 10;
                }
                else {
                    availablePoints = availablePoints - 5;
                };
            };
         }
         else {
             logger.debug('National Criminal result is clear');
         };
    };
    

    return availablePoints;
};

function getSocialMediaPoints(applicantTransaction) {
    var availablePoints = 0;
    var age = applicantTransaction.getAge();
    return using(
         socialMediaHelper.getSocialMediaAccounts(applicantTransaction.getApplicationId(),applicantTransaction.getApplicantRefId()), function(result) {
        if(!_.isNil(result)) {
            availablePoints = result.length * 5;
        };
        return availablePoints;
    });
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

    stepPoints = getIdentityVarificationPoints(applicantTransaction);
    score      = score + stepPoints;
    logger.debug(' -- ' + 'Identity Varification - Step(3) Points = ' + stepPoints + ' Running Score = ' + score);

    stepPoints = getCriminalPoints(applicantTransaction);
    score      = score + stepPoints;
    logger.debug(' -- ' + 'Criminal Verification - Step(4) Points = ' + stepPoints + ' Running Score = ' + score);

    //stepPoints = getSocialMediaPoints(applicantTransaction);
    getSocialMediaPoints(applicantTransaction).then(function(resultPoints) {
        stepPoints = resultPoints;
        score      = score + stepPoints;
        logger.debug(' -- ' + 'Social Media - Step(5) Points = ' + stepPoints + ' Running Score = ' + score);


        score      = score * 10;
        logger.debug(' -- ' + 'Score Times 10 - Step(6)  Running Score = ' + score);

        req.s2mResponse  = new S2mResponse('SUCCESS_SCORE', {"score" : score});
        logger.debug(scriptName + ' Continue ....');
        next();
    })

};
