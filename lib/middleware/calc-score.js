var _ = require('lodash');
var S2mResponse = require('../common/s2mHttpResponse');
var logger = require('../helpers/log-helper');
var config = require('config');
var socialMediaConfig = config.get('SocialMedia');
var socialMediaHelper = require("../helpers/social-media-helper");
var Promise = require('bluebird');
var using = Promise.using;
var db = require("../helpers/mysql-helper");


function getSocalMediaData(applicantTransaction) {
    var query = 'select * from social_media where application_id = ? and applicant_ref_id = ? ';
    var params = [applicantTransaction.getApplicationId() , applicantTransaction.getApplicantRefId()];
    return using(db.query(query, params), function(result) {
        logger.debug(scriptName + ' Ending .... ');
        return result;
    });
}

function scoreCanBeCalulated(applicantTransaction) {
    var response = {}
    response.scoreCanBeCalulated = true;
    response.message = [];

    if(applicantTransaction.ssnTraceRequired()) {
        response.scoreCanBeCalulated = false;
        response.message.push('SSN Trace not completed');
    }

    if(applicantTransaction.quizRequired()) {
        response.scoreCanBeCalulated = false;
        response.message.push('Identity Quize Not completed');
    }
    if(applicantTransaction.sexOffenderVerificationRequired() || applicantTransaction.nationalCriminalVerificationRequired()) {
        response.scoreCanBeCalulated = false;
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
    };
    //else {
    //    var attempts = applicantTransaction.getQuestionAttempts();
    //    if(attempts >= 2) {
    //        availablePoints = availablePoints - 10;
    //    };
    //};

    return availablePoints;
};


function getCriminalPoints(applicantTransaction) {
    var availablePoints = 20;
    
    if(applicantTransaction.sexOffenderVerificationRequired() || applicantTransaction.nationalCriminalVerificationRequired()) {
        logger.debug('sex_offender and nationalCriminal verifications not complete');
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
        var socialAccounts = 0 ;

        var facebook = 0 ;

        var linkedin = 0 ;

        var twitter = 0 ;

        var friends = 0;

        var facebookVerified = false;
        var isFacebookVerified = false;

        if(!_.isNil(result)) {
            _.forEach(result, function(value) {
                socialAccounts = socialAccounts + 1;
                logger.debug(JSON.stringify(value));
                if(value.status == 'active') {
                    if(value.source == 'facebook') {
                        facebook = 1;
                        var profile = JSON.parse(value.profile_data)
                        friends = profile.friends.summary.total_count || 0;
                        facebookVerified = profile.verified || false;
                        isFacebookVerified = profile.is_verified || false;
                    }
                    if(value.source == 'linkedIn') {
                        linkedin = 1;
                    }
                    if(value.source == 'twitter') {
                        twitter = 1;
                    }
                }
            })
        };



        if(age <= 24) {

            if(facebookVerified &&  isFacebookVerified) {
                availablePoints = availablePoints + 5;
            } else {
                if(facebookVerified || isFacebookVerified) {
                    availablePoints = availablePoints + 3;
                }
            }

            if(socialAccounts == 0) {
                availablePoints = availablePoints + 5;
            }
            if(socialAccounts == 3) {
                availablePoints = availablePoints + 10;
            }
            else {
                if(socialAccounts == 2) {
                    if(facebook  == 1 && twitter == 1) {
                        availablePoints = availablePoints + 10;
                    }
                    if(facebook  == 1 && linkedin == 1) {
                        availablePoints = availablePoints + 10;
                    }
                }
            }
            if(friends < 300) {
                availablePoints = availablePoints + 1;
            }
            if(friends >= 300 && friends < 500) {
                availablePoints = availablePoints + 2;
            }
            if(friends >= 500 && friends < 700) {
                availablePoints = availablePoints + 3;
            }
            if(friends >= 700 && friends < 1000) {
                availablePoints = availablePoints + 4;
            }
            if(friends >= 1000) {
                availablePoints = availablePoints + 5;
            }

        }
        if(age > 24 && age <= 44) {
            if(facebookVerified &&  isFacebookVerified) {
                availablePoints = availablePoints + 5;
            } else {
                if(facebookVerified || isFacebookVerified) {
                    availablePoints = availablePoints + 2;
                }
            }


            if(facebookVerified == 'Y') {
                availablePoints = availablePoints + 5;
            }
            if(socialAccounts == 0) {
                availablePoints = availablePoints + 0;
            }
            if(socialAccounts == 3) {
                availablePoints = availablePoints + 10;
            }
            else {
                if(socialAccounts == 2) {
                    if(facebook  == 1 && twitter == 1) {
                        availablePoints = availablePoints + 5;
                    }
                    if(facebook  == 1 && linkedin == 1) {
                        availablePoints = availablePoints + 8;
                    }
                }
            }
            if(friends < 300) {
                availablePoints = availablePoints + 0;
            }
            if(friends >= 300 && friends < 500) {
                availablePoints = availablePoints + 1;
            }
            if(friends >= 500 && friends < 700) {
                availablePoints = availablePoints + 2;
            }
            if(friends >= 700 && friends < 1000) {
                availablePoints = availablePoints + 4;
            }
            if(friends >= 1000) {
                availablePoints = availablePoints + 5;
            }

        }
        if(age > 44 && age <= 54) {
            if(facebookVerified &&  isFacebookVerified) {
                availablePoints = availablePoints + 5;
            } else {
                if(facebookVerified || isFacebookVerified) {
                    availablePoints = availablePoints + 3;
                }
            }

            if(facebookVerified == 'Y') {
                availablePoints = availablePoints + 5;
            }
            if(socialAccounts == 0) {
                availablePoints = availablePoints + 3;
            }
            if(socialAccounts == 3) {
                availablePoints = availablePoints + 10;
            }
            else {
                if(socialAccounts == 2) {
                    if(facebook  == 1 && twitter == 1) {
                        availablePoints = availablePoints + 5;
                    }
                    if(facebook  == 1 && linkedin == 1) {
                        availablePoints = availablePoints + 8;
                    }
                }
            }
            if(friends < 300) {
                availablePoints = availablePoints + 0;
            }
            if(friends >= 300 && friends < 500) {
                availablePoints = availablePoints + 2;
            }
            if(friends >= 500 && friends < 700) {
                availablePoints = availablePoints + 3;
            }
            if(friends >= 700 && friends < 1000) {
                availablePoints = availablePoints + 5;
            }
            if(friends >= 1000) {
                availablePoints = availablePoints + 5;
            }

        }
        if(age > 54 && age <= 64) {
            if(facebookVerified &&  isFacebookVerified) {
                availablePoints = availablePoints + 5;
            } else {
                if(facebookVerified || isFacebookVerified) {
                    availablePoints = availablePoints + 3;
                }
            }

            if(facebookVerified == 'Y') {
                availablePoints = availablePoints + 5;
            }
            if(socialAccounts == 0) {
                availablePoints = availablePoints + 5;
            }
            if(socialAccounts == 3) {
                availablePoints = availablePoints + 10;
            }
            else {
                if(socialAccounts == 2) {
                    if(facebook  == 1 && twitter == 1) {
                        availablePoints = availablePoints + 5;
                    }
                    if(facebook  == 1 && linkedin == 1) {
                        availablePoints = availablePoints + 8;
                    }
                }
            }
            if(friends < 300) {
                availablePoints = availablePoints + 3;
            }
            if(friends >= 300 && friends < 500) {
                availablePoints = availablePoints + 4;
            }
            if(friends >= 500 && friends < 700) {
                availablePoints = availablePoints + 5;
            }
            if(friends >= 700 && friends < 1000) {
                availablePoints = availablePoints + 5;
            }
            if(friends >= 1000) {
                availablePoints = availablePoints + 5;
            }

        }

        if(age > 64) {
            if(facebookVerified &&  isFacebookVerified) {
                availablePoints = availablePoints + 5;
            } else {
                if(facebookVerified || isFacebookVerified) {
                    availablePoints = availablePoints + 4;
                }
            }

            if(socialAccounts == 0) {
                availablePoints = availablePoints + 7;
            }
            if(socialAccounts == 3) {
                availablePoints = availablePoints + 10;
            }
            else {
                if(socialAccounts == 2) {
                    if(facebook  == 1 && twitter == 1) {
                        availablePoints = availablePoints + 8;
                    }
                    if(facebook  == 1 && twitter == 1) {
                        availablePoints = availablePoints + 9;
                    }
                }
            }
            if(friends < 300) {
                availablePoints = availablePoints + 1;
            }
            if(friends >= 300 && friends < 500) {
                availablePoints = availablePoints + 2;
            }
            if(friends >= 500 && friends < 700) {
                availablePoints = availablePoints + 3;
            }
            if(friends >= 700 && friends < 1000) {
                availablePoints = availablePoints + 4;
            }
            if(friends >= 1000) {
                availablePoints = availablePoints + 5;
            }
        }
        return availablePoints;
    });
};

function getVerificationActivityPoints(applicantTransaction) {
    var availablePoints = 0;
    var totalEvents = applicantTransaction.getActivities() + applicantTransaction.getVerifications();

    if(totalEvents > 0 ){
        availablePoints = availablePoints + 1;
    }
    if(totalEvents >= 30){
        availablePoints = availablePoints + 1;
    }
    if(totalEvents >= 60 ){
        availablePoints = availablePoints + 1;
    }
    if(totalEvents >=90 ){
        availablePoints = availablePoints + 1
    }

    if(totalEvents >= 100 ){
        availablePoints = availablePoints + 1
    }

    return availablePoints;

};





module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    console.log(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        logger.error('No Appicant Transaction found in request object');
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {
            "internal": "yes",
            "script": scriptName,
            "processStep": "CALC_SCORE",
            "message": "No Appicant Transaction found in request object"
        };
        httpResponseOptions.errorCode = "SCORE_CALC_NOT_ALLOWED";
        req.s2mResponse = new S2mResponse('SERVICE_ERROR', httpResponseOptions);

        logger.debug(scriptName + ' Continue ....');
        next();

    };
    var canCalcScore = scoreCanBeCalulated(applicantTransaction);
    if(!canCalcScore.scoreCanBeCalulated) {
        logger.debug(scriptName + ' Score cannot be Calculated because ' + JSON.stringify(canCalcScore.message));
        logger.error('No Appicant Transaction found in request object');
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {
            "internal": "yes",
            "script": scriptName,
            "processStep": "CALC_SCORE",
            "message": "Missing Verifications Score Calculation Not allowed"
        };
        httpResponseOptions.errorCode = "SCORE_CALC_NOT_ALLOWED";
        req.s2mResponse = new S2mResponse('SCORE_CALC_NOT_ALLOWED', httpResponseOptions);

        logger.debug(scriptName + ' Continue ....');
        next();
    }
    var score      = 0;
    var stepPoints = 0;

    stepPoints =  getSsnTracePoints(applicantTransaction);
    score      = score + stepPoints;
    logger.debug(' -- ' + 'SSN Trace - Step(1) Points = ' + stepPoints + ' Running Score = ' + score);


    stepPoints = getIdentityVarificationPoints(applicantTransaction);
    score      = score + stepPoints;
    logger.debug(' -- ' + 'Identity Varification - Step(2) Points = ' + stepPoints + ' Running Score = ' + score);

    //stepPoints = getIdentityVarificationPoints(applicantTransaction);
    //score      = score + stepPoints;
    //logger.debug(' -- ' + 'Identity Varification - Step(3) Points = ' + stepPoints + ' Running Score = ' + score);

    stepPoints = getCriminalPoints(applicantTransaction);
    score      = score + stepPoints;
    logger.debug(' -- ' + 'Criminal Verification - Step(3) Points = ' + stepPoints + ' Running Score = ' + score);

    stepPoints = getVerificationActivityPoints(applicantTransaction);
    score      = score + stepPoints;
    logger.debug(' -- ' + 'Verification Activity - Step(4) Points = ' + stepPoints + ' Running Score = ' + score);

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
