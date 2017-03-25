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
        response.message.push('Identity Quiz Not completed');
    }
    if(applicantTransaction.sexOffenderVerificationRequired()) {
        response.scoreCanBeCalulated = false;
        response.message.push('sex Offender Verification Not Complete');
    }

    if(applicantTransaction.nationalCriminalVerificationRequired()) {

        response.scoreCanBeCalulated = false;
        response.message.push('national Criminal Verification Not Complete');

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
            //var breakdown = sexOffender.breakdown;
            //logger.debug('sex_offender breakdown' + JSON.stringify(breakdown));
            //if((breakdown.full_name.result == 'consider') && (breakdown.address.result == 'consider') && (breakdown.age.result == 'consider')) {
            //    availablePoints = availablePoints - 20;
            //}
            //else {
            //    availablePoints = availablePoints - 5;
            //};
            availablePoints = availablePoints - 20;
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
    var scoreTrace = {};

    var age = applicantTransaction.getAge();


    scoreTrace.age = age;

    return using(
        socialMediaHelper.getSocialMediaAccounts(applicantTransaction.getApplicationId(),applicantTransaction.getApplicantRefId()), function(result) {
        var socialAccounts = 0 ;

        var facebook = 0 ;

        var linkedin = 0 ;

        var twitter = 0 ;

        var friends = 0;

        var facebookVerified = false;
        var isFacebookVerified = false;
        var facebookFirstName = undefined;
        var facebookLastName = undefined;
        var facebookFullName = undefined;

        scoreTrace.hasFacebook = false;
        scoreTrace.facebookFriends = 0;
        scoreTrace.facebookVerified = false;
        scoreTrace.facebookIsVerified = false;
        scoreTrace.facebookVerifiedPoints = 0;
        scoreTrace.facebookVerifiedPointsReason = "No verification flags set on face book account";
        scoreTrace.facebookAccountPoints = 0;
        scoreTrace.facebookAccountPointsReason = "No social media accounts";
        scoreTrace.friendPoints = 0;
        scoreTrace.friendPointsReason = "No social media friends";
        scoreTrace.facebookProfile = {};
        scoreTrace.facebookProfileMissingSegments = "";
        scoreTrace.linkedin = false;
        scoreTrace.twitter = false;
        scoreTrace.facebookFullName = "blank";
        scoreTrace.facebookLastName = "blank";
        scoreTrace.facebookFirstName = "blank";

        if(!_.isNil(result)) {
            _.forEach(result, function(value) {
                socialAccounts = socialAccounts + 1;
                //logger.debug(value.source + " - " + JSON.stringify(value));
                if(value.status == 'active') {
                    if(value.source == 'facebook') {
                        facebook = 1;
                        var profile = JSON.parse(value.profile_data);
                        scoreTrace.facebookProfile = profile;
                        logger.debug("**** start facebook name check ");
                        if (_.isNil(profile.friends)) {
                            scoreTrace.facebookFriends = 0;
                            scoreTrace.facebookProfileMissingSegments = scoreTrace.facebookProfileMissingSegments + "friends, "
                        }
                        else {
                            if(_.isNil(profile.friends.summary)) {
                                scoreTrace.facebookFriends = 0;
                                scoreTrace.facebookProfileMissingSegments = scoreTrace.facebookProfileMissingSegments + "friends.summary, "
                            }
                            else {
                                if(_.isNil(profile.friends.summary.total_count)) {
                                    scoreTrace.facebookFriends = 0;
                                    scoreTrace.facebookProfileMissingSegments = scoreTrace.facebookProfileMissingSegments + "friends.summary.total_count, "
                                }
                                else {
                                    friends = profile.friends.summary.total_count || 0;
                                }
                            }
                        }
                        facebookVerified = profile.verified || false;
                        isFacebookVerified = profile.is_verified || false;
                        facebookFirstName = profile.first_name || "undefined";
                        facebookLastName = profile.last_name || "undefined";
                        facebookFullName = profile.name || undefined;

                        scoreTrace.facebookVerified = profile.verified;
                        scoreTrace.facebookIsVerified = profile.is_verified;
                        scoreTrace.hasFacebook = true;
                        scoreTrace.facebookFullName = facebookFullName;
                        scoreTrace.facebookLastName = facebookLastName;
                        scoreTrace.facebookFirstName = facebookFirstName;


                    }
                    if(value.source == 'linkedIn') {
                        linkedin = 1;
                        scoreTrace.linkedin = true;
                    }
                    if(value.source == 'twitter') {
                        twitter = 1;
                        scoreTrace.twitter = true;
                    }
                }
            })
        };

        // This section same for all ages
        try {
            if(facebook == 1)
            {

                var fmfnMatch = false;
                var fmlnMatch = false;


                if (scoreTrace.facebookFirstName == applicantTransaction.getFirstName()) {
                    fmfnMatch = true;
                }

                if (scoreTrace.facebookLastName == applicantTransaction.getLastName()) {
                    fmlnMatch = true;
                }
                if (fmfnMatch && fmlnMatch) {
                    availablePoints = availablePoints + 2;
                    scoreTrace.facebookNameMatchPoint = 2;
                    scoreTrace.facebookNameMatchPointReason = "Facebook account First and Last Name match Verified First and Last Name";
                }
                else {
                    if (!fmfnMatch && !fmlnMatch) {
                        scoreTrace.facebookNameMatchPoint = 0;
                        scoreTrace.facebookNameMatchPointReason = "No Match On Name Facebook Full Name  = " + facebookFirstName + " " + facebookLastName +
                                                                  " Verified Full Name = " + applicantTransaction.getFirstName() + " " + applicantTransaction.getLastName();

                    }
                    else {

                        if (fmfnMatch) {
                            scoreTrace.facebookNameMatchPoint = 0;
                            scoreTrace.facebookNameMatchPointReason = "Only match on First name Facebook Last Name = " + facebookLastName + " Verified Last Name = " + applicantTransaction.getLastName();
                        }
                        if (fmlnMatch) {
                            scoreTrace.facebookNameMatchPoint = 0;
                            scoreTrace.facebookNameMatchPointReason = "Only match on Last name Facebook First Name = " + facebookFirstName + " Verified Last Name = " + applicantTransaction.getFirstName();
                        }
                    }
                }


            }
            else
            {
                scoreTrace.facebookNameMatchPoint = 0;
                scoreTrace.facebookNameMatchPointReason = "Not Facebook socialmedia account";

            }
        }
        catch(err) {
            scoreTrace.facebookNameMatchPoint = 0;
            scoreTrace.facebookNameMatchPointReason = "Error Checking FacebookName. Error: " + err.message;
        }

        if(age <= 24) {

            if(facebookVerified &&  isFacebookVerified) {
                availablePoints = availablePoints + 5;
                scoreTrace.facebookVerifiedPoints = 5;
                scoreTrace.facebookVerifiedPointsReason = "age <= 24 and facebook Verfied and isVerified flags";
            } else {
                if(facebookVerified || isFacebookVerified) {
                    availablePoints = availablePoints + 3;
                    scoreTrace.facebookVerifiedPoints = 3;
                    if(facebookVerified) scoreTrace.facebookVerifiedPointsReason = "age <= 24 and facebook Verfied flag only";
                    if(isFacebookVerified) scoreTrace.facebookVerifiedPointsReason = "age <= 24 and facebook isVerfied flag only";

                }
            }



            //if(socialAccounts == 0) {
            //    availablePoints = availablePoints + 5;
            //    scoreTrace.facebookAccountPoints = 5;
            //    scoreTrace.facebookAccountPointsReason = "age <= 24 and  0 social media accounts";
            //}
            if(socialAccounts == 3)
            {
                availablePoints = availablePoints + 10;
                scoreTrace.facebookAccountPoints = 10;
                scoreTrace.facebookAccountPointsReason = "age <= 24 and 3 social media accounts";
            }
            else
            {
                if(socialAccounts == 2) {
                    availablePoints = availablePoints + 10;
                    scoreTrace.facebookAccountPoints = 10;
                    scoreTrace.facebookAccountPointsReason = "age <= 24 and  2 social media accounts";
                }
                else
                {
                    if(socialAccounts == 1)
                    {
                        availablePoints = availablePoints + 10;
                        scoreTrace.facebookAccountPoints = 10;
                        scoreTrace.facebookAccountPointsReason = "age <= 24 and 1 social media account";
                    }
                }
            }
            if(friends < 300) {
                availablePoints = availablePoints + 1;
                scoreTrace.friendPoints = 1;
                scoreTrace.friendPointsReason = "age <= 24 and < 300 social media friends";
            }
            if(friends >= 300 && friends < 500) {
                availablePoints = availablePoints + 2;
                scoreTrace.friendPoints = 2;
                scoreTrace.friendPointsReason = "age <= 24 and between 300 and 499 social media friends";
            }
            if(friends >= 500 && friends < 700) {
                availablePoints = availablePoints + 3;
                scoreTrace.friendPoints = 3;
                scoreTrace.friendPointsReason = "age <= 24 and between 500 and 699 social media friends";
            }
            if(friends >= 700 && friends < 1000) {
                availablePoints = availablePoints + 4;
                scoreTrace.friendPoints = 4;
                scoreTrace.friendPointsReason = "age <= 24 and between 700 and 999 social media friends";
            }
            if(friends >= 1000) {
                availablePoints = availablePoints + 5;
                scoreTrace.friendPoints = 4;
                scoreTrace.friendPointsReason = "age <= 24 and between 700 and 999 social media friends";
            }

        }
        if(age > 24 && age <= 44) {
            if(facebookVerified &&  isFacebookVerified) {
                availablePoints = availablePoints + 5;
                scoreTrace.facebookVerifiedPoints = 5;
                scoreTrace.facebookVerifiedPointsReason = "> 24 age <= 44 and facebook Verfied and isVerified flags";
            } else {
                if(facebookVerified || isFacebookVerified) {
                    availablePoints = availablePoints + 2;
                    scoreTrace.facebookVerifiedPoints = 2;
                    if(facebookVerified) scoreTrace.facebookVerifiedPointsReason = "> 24 age <= 44 and facebook Verfied flag only";
                    if(isFacebookVerified) scoreTrace.facebookVerifiedPointsReason = "> 24 age <= 44 and facebook isVerfied flag only";

                }
            }


            //if(facebookVerified == 'Y') {
            //    availablePoints = availablePoints + 5;
            //}
            //if(socialAccounts == 0) {
            //    availablePoints = availablePoints + 0;
            //    scoreTrace.facebookAccountPoints = 0;
            //    scoreTrace.facebookAccountPointsReason = "> 24 age <= 44 and 0 social media accounts";
            //}
            if(socialAccounts == 3)
            {
                availablePoints = availablePoints + 10;
                scoreTrace.facebookAccountPoints = 10;
                scoreTrace.facebookAccountPointsReason = "> 24 age <= 44 and 3 social media accounts";
            }
            else
            {
                if(socialAccounts == 2)
                {
                    availablePoints = availablePoints + 8;
                    scoreTrace.facebookAccountPoints = 8;
                    scoreTrace.facebookAccountPointsReason = "> 24 age <= 44 and  2 social media accounts";
                }
                else
                {
                    if(socialAccounts == 1)
                    {
                        availablePoints = availablePoints + 5;
                        scoreTrace.facebookAccountPoints = 5;
                        scoreTrace.facebookAccountPointsReason = "> 24 age <= 44 and  1 social media account";
                    }
                }
            }
            if(friends < 300) {
                availablePoints = availablePoints + 0;
                scoreTrace.friendPoints = 0;
                scoreTrace.friendPointsReason = "> 24 age <= 44 and  < 300 social media friends";
            }
            if(friends >= 300 && friends < 500) {
                availablePoints = availablePoints + 1;
                scoreTrace.friendPoints = 1;
                scoreTrace.friendPointsReason = "> 24 age <= 44 and between 300 and 499 social media friends";
            }
            if(friends >= 500 && friends < 700) {
                availablePoints = availablePoints + 2;
                scoreTrace.friendPoints = 2;
                scoreTrace.friendPointsReason = "> 24 age <= 44 and between 500 and 699 social media friends";
            }
            if(friends >= 700 && friends < 1000) {
                availablePoints = availablePoints + 4;
                scoreTrace.friendPoints = 4;
                scoreTrace.friendPointsReason = "> 24 age <= 44 and between 700 and 999 social media friends";
            }
            if(friends >= 1000) {
                availablePoints = availablePoints + 5;
                scoreTrace.friendPoints = 5;
                scoreTrace.friendPointsReason = "> 24 age <= 44 and >= 1000 social media friends";
            }

        }
        if(age > 44 && age <= 54) {
            if(facebookVerified &&  isFacebookVerified) {
                availablePoints = availablePoints + 5;
                scoreTrace.facebookVerifiedPoints = 5;
                scoreTrace.facebookVerifiedPointsReason = "> 44 age <= 54 and facebook Verfied and isVerified flags"
            } else {
                if(facebookVerified || isFacebookVerified) {
                    availablePoints = availablePoints + 3;
                    scoreTrace.facebookVerifiedPoints = 3;
                    if(facebookVerified) scoreTrace.facebookVerifiedPointsReason = "> 44 age <= 54 and facebook Verfied flag only";
                    if(isFacebookVerified) scoreTrace.facebookVerifiedPointsReason = "> 44 age <= 54 and facebook isVerfied flag only";
                }
            }

            //if(facebookVerified == 'Y') {
            //    availablePoints = availablePoints + 5;
            //}
            //if(socialAccounts == 0) {
            //    availablePoints = availablePoints + 3;
            //    scoreTrace.facebookAccountPoints = 3;
            //    scoreTrace.facebookAccountPointsReason = "> 44 age <= 54 and 0 social media accounts";
            //}
            if(socialAccounts == 3)
            {
                availablePoints = availablePoints + 10;
                scoreTrace.facebookAccountPoints = 10;
                scoreTrace.facebookAccountPointsReason = "> 44 age <= 54 and 3 social media accounts";
            }
            else
            {
                if(socialAccounts == 2)
                {

                    availablePoints = availablePoints + 8;
                    scoreTrace.facebookAccountPoints = 8;
                    scoreTrace.facebookAccountPointsReason = "> 44 age <= 54 and 2 social media accounts";
                }
                else
                {

                    if(socialAccounts == 1)
                    {
                        availablePoints = availablePoints + 5;
                        scoreTrace.facebookAccountPoints = 5;
                        scoreTrace.facebookAccountPointsReason = "> 44 age <= 54 and 1 social media account";
                    }
                }
            }
            if(friends < 300) {
                availablePoints = availablePoints + 0;
                scoreTrace.friendPoints = 0;
                scoreTrace.friendPointsReason = "> 44 age <= 54 and < 300 social media friends";
            }
            if(friends >= 300 && friends < 500) {
                availablePoints = availablePoints + 2;
                scoreTrace.friendPoints = 2;
                scoreTrace.friendPointsReason = "> 44 age <= 54 and between 300 and 499 social media friends";
            }
            if(friends >= 500 && friends < 700) {
                availablePoints = availablePoints + 3;
                scoreTrace.friendPoints = 3;
                scoreTrace.friendPointsReason = "> 44 age <= 54 and between 500 and 599 social media friends";
            }
            if(friends >= 700 && friends < 1000) {
                availablePoints = availablePoints + 5;
                scoreTrace.friendPoints = 5;
                scoreTrace.friendPointsReason = "> 44 age <= 54 and between 700 and 999 social media friends";
            }
            if(friends >= 1000) {
                availablePoints = availablePoints + 5;
                scoreTrace.friendPoints = 5;
                scoreTrace.friendPointsReason = "> 44 age <= 54 and >= 1000 social media friends";
            }

        }
        if(age > 54 && age <= 64) {
            if(facebookVerified &&  isFacebookVerified) {
                availablePoints = availablePoints + 5;
                scoreTrace.facebookVerifiedPoints = 5;
                scoreTrace.facebookVerifiedPointsReason = "> 54 age <= 64 and facebook Verfied and isVerified flags"
            } else {
                if(facebookVerified || isFacebookVerified) {
                    availablePoints = availablePoints + 3;
                    scoreTrace.facebookVerifiedPoints = 3;
                    if(facebookVerified) scoreTrace.facebookVerifiedPointsReason = "> 54 age <= 64 and facebook Verfied flag only";
                    if(isFacebookVerified) scoreTrace.facebookVerifiedPointsReason = "> 54 age <= 64 and facebook isVerfied flag only";
                }
            }

           // if(facebookVerified == 'Y') {
           //     availablePoints = availablePoints + 5;
           // }
           // if(socialAccounts == 0) {
           //     availablePoints = availablePoints + 5;
           //     scoreTrace.friendPoints = 5;
           //     scoreTrace.friendPointsReason = "> 54 age <= 64 and 0 social media accounts";
            //}
            if(socialAccounts == 3)
            {
                availablePoints = availablePoints + 10;
                scoreTrace.facebookAccountPoints = 10;
                scoreTrace.facebookAccountPointsReason = "> 54 age <= 64 and 3 social media accounts";
            }
            else
            {
                if(socialAccounts == 2) {

                    availablePoints = availablePoints + 8;
                    scoreTrace.facebookAccountPoints = 8;
                    scoreTrace.facebookAccountPointsReason = "> 54 age <= 64 and 2 social media accounts";
                }
                else
                {
                    if(socialAccounts == 1)
                    {
                        availablePoints = availablePoints + 5;
                        scoreTrace.facebookAccountPoints = 5;
                        scoreTrace.facebookAccountPointsReason = "> 54 age <= 64 and 1 social media account";
                    }
                }
            }
            if(friends < 300) {
                availablePoints = availablePoints + 3;
                scoreTrace.friendPoints = 3;
                scoreTrace.friendPointsReason = "> 54 age <= 64 and < 300 social media friends";
            }
            if(friends >= 300 && friends < 500) {
                availablePoints = availablePoints + 4;
                scoreTrace.friendPoints = 4;
                scoreTrace.friendPointsReason = "> 54 age <= 64 and between 300 and 499 social media friends";
            }
            if(friends >= 500 && friends < 700) {
                availablePoints = availablePoints + 5;
                scoreTrace.friendPoints = 5;
                scoreTrace.friendPointsReason = "> 54 age <= 64 and between 500 and 699 social media friends";
            }
            if(friends >= 700 && friends < 1000) {
                availablePoints = availablePoints + 5;
                scoreTrace.friendPoints = 5;
                scoreTrace.friendPointsReason = "> 54 age <= 64 and between 700 and 999 social media friends";
            }
            if(friends >= 1000) {
                availablePoints = availablePoints + 5;
                scoreTrace.friendPoints = 5;
                scoreTrace.friendPointsReason = "> 54 age <= 64 and > 1000 social media friends";
            }

        }

        if(age > 64) {
            if(facebookVerified &&  isFacebookVerified) {
                availablePoints = availablePoints + 5;
                scoreTrace.facebookVerifiedPoints = 5;
                scoreTrace.facebookVerifiedPointsReason = "age > 64 and facebook Verfied and isVerified flags"
            } else {
                if(facebookVerified || isFacebookVerified) {
                    availablePoints = availablePoints + 4;
                    scoreTrace.facebookVerifiedPoints = 4;
                    if(facebookVerified) scoreTrace.facebookVerifiedPointsReason = "age > 64 and facebook Verfied flag only";
                    if(isFacebookVerified) scoreTrace.facebookVerifiedPointsReason = "age > 64 and facebook isVerfied flag only";
                }
            }

            if(socialAccounts == 0) {
                availablePoints = availablePoints + 7;
                scoreTrace.facebookAccountPoints = 7;
                scoreTrace.facebookAccountPointsReason = "age > 64 and 0 social media accounts";
            }
            if(socialAccounts == 3) {
                availablePoints = availablePoints + 10;
                scoreTrace.facebookAccountPoints = 10;
                scoreTrace.facebookAccountPointsReason = "age > 64 and 3 social media accounts";
            }
            else {
                if(socialAccounts == 2) {
                    if(facebook  == 1 && twitter == 1) {
                        availablePoints = availablePoints + 8;
                        scoreTrace.facebookAccountPoints = 8;
                        scoreTrace.facebookAccountPointsReason = "age > 64 and 2 social media accounts facebook and twitter";

                    }
                    if(facebook  == 1 && twitter == 1) {
                        availablePoints = availablePoints + 9;
                        scoreTrace.facebookAccountPoints = 9;
                        scoreTrace.facebookAccountPointsReason = "age > 64 and 2 social media accounts facebook and twitter";
                    }
                }
            }
            if(friends < 300) {
                availablePoints = availablePoints + 1;
                scoreTrace.friendPoints = 1;
                scoreTrace.friendPointsReason = "age > 64 and < 300 ";
            }
            if(friends >= 300 && friends < 500) {
                availablePoints = availablePoints + 2;
                scoreTrace.friendPoints = 2;
                scoreTrace.friendPointsReason = "age > 64 and between 300 and 499 social media friends";
            }
            if(friends >= 500 && friends < 700) {
                availablePoints = availablePoints + 3;
                scoreTrace.friendPoints = 3;
                scoreTrace.friendPointsReason = "age > 64 and between 500 and 699 social media friends";
            }
            if(friends >= 700 && friends < 1000) {
                availablePoints = availablePoints + 4;
                scoreTrace.friendPoints = 4;
                scoreTrace.friendPointsReason = "age > 64 and between 700 and 999 social media friends";
            }
            if(friends >= 1000) {
                availablePoints = availablePoints + 5;
                scoreTrace.friendPoints = 5;
                scoreTrace.friendPointsReason = "age > 64  > 1000 social media friends";
            }
        }

        scoreTrace.socialMediaPoints = availablePoints
        return scoreTrace;
        //return availablePoints;
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
    logger.debug(scriptName + ' Starting ....');
    var scoreTrace = {};
    req.scoreTrace = scoreTrace;
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
        httpResponseOptions.errorCode = "SERVICE_ERROR";
        req.s2mResponse = new S2mResponse('SERVICE_ERROR', httpResponseOptions);

        logger.debug(scriptName + ' Continue ....');
        next();
        return;

    };
    var scoreTrace = {};
    //scoreTrace.age =
    var canCalcScore = scoreCanBeCalulated(applicantTransaction);
    scoreTrace.scoreCanBeCalulated = true;
    if(!canCalcScore.scoreCanBeCalulated) {
        scoreTrace.scoreCanBeCalulated = false;
        scoreTrace.noCalcMessage = JSON.stringify(canCalcScore.message);
        logger.debug(scriptName + ' Score cannot be Calculated because ' + JSON.stringify(canCalcScore.message));
        logger.error(' Score cannot be Calculated because ' + JSON.stringify(canCalcScore.message));
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
        req.scoreTrace = scoreTrace;
        next();

    } else {
        var score      = 0;
        var stepPoints = 0;
        scoreTrace.age = applicantTransaction.getAge();

        stepPoints =  getSsnTracePoints(applicantTransaction);
        score      = score + stepPoints;
        logger.debug(' -- ' + 'SSN Trace - Step(1) Points = ' + stepPoints + ' Running Score = ' + score);
        //scoreTrace.ssnTrace = {};
        scoreTrace.ssnTracePoints = (stepPoints * 10);

        stepPoints = getIdentityVarificationPoints(applicantTransaction);
        score      = score + stepPoints;
        logger.debug(' -- ' + 'Identity Varification - Step(2) Points = ' + stepPoints + ' Running Score = ' + score);
        //scoreTrace.idVerification = {};
        scoreTrace.idVerificationPoints = (stepPoints * 10);

        //stepPoints = getIdentityVarificationPoints(applicantTransaction);
        //score      = score + stepPoints;
        //logger.debug(' -- ' + 'Identity Varification - Step(3) Points = ' + stepPoints + ' Running Score = ' + score);

        stepPoints = getCriminalPoints(applicantTransaction);
        score      = score + stepPoints;
        logger.debug(' -- ' + 'Criminal Verification - Step(3) Points = ' + stepPoints + ' Running Score = ' + score);
        //scoreTrace.criminalPoints = {};
        scoreTrace.criminalPointsPoints = (stepPoints * 10);



        //stepPoints = getSocialMediaPoints(applicantTransaction);
        getSocialMediaPoints(applicantTransaction).then(function(resultPoints) {
            //stepPoints = resultPoints;
            stepPoints = resultPoints.socialMediaPoints;
            resultPoints.socialMediaPoints = (resultPoints.socialMediaPoints *10);
            score      = score + stepPoints;
            logger.debug(' -- ' + 'Social Media - Step(4) Points = ' + stepPoints + ' Running Score = ' + score);

            scoreTrace.socialMedia = resultPoints;


            score      = score * 10;
            logger.debug(' -- ' + 'Score Times 10 - Step(5)  Running Score = ' + score);

            stepPoints = getVerificationActivityPoints(applicantTransaction);
            score      = score + stepPoints;
            logger.debug(' -- ' + 'Verification Activity - Step(6) Points = ' + stepPoints + ' Running Score = ' + score);
            //scoreTrace.activityPoints = {};
            scoreTrace.activityPointsActivities = applicantTransaction.getActivities();
            scoreTrace.activityPointsVerifications = applicantTransaction.getVerifications();
            var totalEvents = applicantTransaction.getActivities() + applicantTransaction.getVerifications();
            scoreTrace.activityVerificationPoints = (stepPoints);

            req.s2mResponse  = new S2mResponse('SUCCESS_SCORE', {"score" : score});

            scoreTrace.totalscore = score;
            req.scoreTrace = scoreTrace;
            logger.debug("Score Trace : " + JSON.stringify(scoreTrace));
            logger.debug(scriptName + ' Continue ....');
            next();
        });
    }


};
