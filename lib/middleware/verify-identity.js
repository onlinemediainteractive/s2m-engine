var Promise = require('bluebird');
var _ = require('lodash');
var config = require('config');
var lexisNexisConfig = config.get('LexisNexis.config');
var lexisnexisHelper = Promise.promisifyAll(require('../helpers/lexisnexis-helper'));
var rp = require('request-promise');
var db = require("../helpers/mysql-helper");
var S2mResponse = require('../common/s2mHttpResponse');
var logger = require('../helpers/log-helper');


getQuestions = function(req) {
    var scriptName = __filename.split(/[\\/]/).pop();
    var spaces = '-- ';
    logger.debug(spaces + scriptName + ' Starting ....');

    var auth = new Buffer(process.env.LEXIS_NEXIS_USER + ":" + process.env.LEXIS_NEXIS_PASSWORD).toString("base64");

    var soapUrl = lexisNexisConfig.url + lexisNexisConfig.wsdlPath;
    logger.debug('soapUrl : ' + soapUrl);
    var options = {wsdl_headers: {Authorization:auth}};
    var params = req.body;

    if(_.isNil(params)) {
        logger.error('Request does not contain any Body elements');
    };

    var soapParams = {};

    soapParams.firstName      = params.firstName;
    soapParams.lastName       = params.lastName;
    soapParams.dob            = params.dob;
    soapParams.ssn            = params.ssn;
    soapParams.street         = params.street;
    soapParams.city           = params.city;
    soapParams.state          = params.state;
    soapParams.postalCode     = params.postalCode;
    soapParams.addressContext = 'primary';
    soapParams.userIpAddress  = params.userIpAddress;

    var soapBody = lexisnexisHelper.parseVerificationBody(soapParams);
    logger.debug('soapBody : ' + soapBody);
    var options = {};
    var fullUrl = lexisNexisConfig.url;

    options = {
        url : fullUrl,
        method : 'POST',
        headers : { 'Authorization': 'Basic ' + auth,  'Content-Type': 'text/xml', 'Content-Length': soapBody.length},
        body: soapBody,
        json: false
    };

    return  rp(options)
        .then(function (httpResponse) {
            logger.debug('Get Questions : ' + httpResponse)
            return  lexisnexisHelper.response2jsonAsync(httpResponse)
                .then(function(jsonResponse) {
                    var questionResponse = {};
                    questionResponse.transactionId  = jsonResponse.transactionId;
                    questionResponse.questionSetId  = jsonResponse.questionSetId;
                    questionResponse.questions      = jsonResponse.questions;
                    questionResponse.nbrOfQuestions = jsonResponse.questions.length;
                    var httpResponseOptions = {};
                    httpResponseOptions.message = jsonResponse.message;
                    httpResponseOptions.questions = questionResponse;
                    var s2mResponse = new S2mResponse('SUCCESS_RETURN_QUESTION',httpResponseOptions);

                    logger.debug(spaces + 'System Mode :' + JSON.stringify(req.appInfo));
                    if(req.appInfo.isDevelopmentMode()) {
                        logger.debug(spaces + 'Answer Response:' + JSON.stringify(jsonResponse.testResponse));
                    }
                    logger.debug(spaces + scriptName + ' Returning ....');
                    return ({"s2mResponse":s2mResponse, "verificationStatus" : jsonResponse.verificationStatus });
                })
                .catch(function (err) {
                    logger.info(spaces + " Error: " + JSON.stringify(err.message));
                    //var objs = {};
                    //objs.internal = err.message
                    //var s2mResponse = new S2mResponse('FAILURE_IDENTITY-NOT-FOUND', objs);
                    var verificationStatus = {"status": "Error",
                                             "reason" : err.message};
                    var httpResponseOptions = {};

                    httpResponseOptions.internalMessage = {"internal" : "no",
                        "script" : scriptName,
                        "processStep" : "VERIFY_IDENTITY",
                        "message" : err.message};

                    var s2mResponse = new S2mResponse('FAILURE_IDENTITY_NOT_FOUND',httpResponseOptions);
                    logger.debug(spaces + scriptName + ' Returning ....');
                    return ({"s2mResponse":s2mResponse, "verificationStatus" : verificationStatus});
                });
        })
        .catch(function (err) {
            logger.error(spaces + " Error: " +  JSON.stringify(err));
            //var objs = {};
            //objs.internal = err.message;
            //var s2mResponse = new S2mResponse('REMOTE_ERR_LEXISNEXIS', objs);
            var verificationStatus = {"status": "Error",
                                      "reason" : err.message};
            var httpResponseOptions = {};
            httpResponseOptions.internalMessage = {"internal" : "yes",
                "script" : scriptName,
                "processStep" : "VERIFY_IDENTITY",
                "message " : "External Service Error :" + err.message};
            httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
            var s2mResponse = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
            logger.debug(spaces + scriptName + ' Returning ....');
            return ({"s2mResponse":s2mResponse,  "verificationStatus" : verificationStatus});
        });
};



answerQuestions = function(req) {
    var spaces = '-- ';
    logger.debug(spaces + scriptName + ' Starting ....');
    var scriptName = __filename.split(/[\\/]/).pop();
    var auth = new Buffer(process.env.LEXIS_NEXIS_USER + ":" + process.env.LEXIS_NEXIS_PASSWORD).toString("base64");

    var params = req.body;

    var soapParams = {};
    soapParams.transactionId = params.transactionId;
    soapParams.questionSetId = params.questionSetId;
    soapParams.answers       = params.answers;

    var soapBody = lexisnexisHelper.parseVerificationAnswerBody(soapParams);
    var options = {};
    var fullUrl = lexisNexisConfig.url;

    options = {
        url : fullUrl,
        method : 'POST',
        headers : { 'Authorization': 'Basic ' + auth,  'Content-Type': 'text/xml', 'Content-Length': soapBody.length},
        body: soapBody,
        json: false
    };
    return  rp(options)
        .then(function (httpResponse) {
            logger.debug('Answer Questions : ' + httpResponse)
            return  lexisnexisHelper.response2jsonAsync(httpResponse)
                .then(function(jsonResponse) {
                    // could be a second set of questions
                    var s2mResponse = undefined;
                    if(jsonResponse.questions.length > 0) {
                        var questionResponse = {};
                        questionResponse.transactionId  = jsonResponse.transactionId;
                        questionResponse.questionSetId  = jsonResponse.questionSetId;
                        questionResponse.questions      = jsonResponse.questions;
                        questionResponse.nbrOfQuestions = jsonResponse.questions.length;
                        //var s2mResponse = new S2mResponse('SUCCESS_RETURN_QUESTION',{"message" : jsonResponse.message, "questions" : questionResponse});
                        var httpResponseOptions = {};
                        httpResponseOptions.message = jsonResponse.message;
                        httpResponseOptions.questions = questionResponse;
                        s2mResponse = new S2mResponse('SUCCESS_RETURN_QUESTION',httpResponseOptions);
                        if(req.appInfo.isDevelopmentMode()) {
                            logger.debug('Answer Response:' + JSON.stringify(jsonResponse.testResponse));
                        }
                    };

                    if(jsonResponse.verificationStatus.status == 'failure') {
                        var httpResponseOptions = {};
                        httpResponseOptions.message = jsonResponse.message;

                        s2mResponse = new S2mResponse('FAILURE_QUIZ',httpResponseOptions);
                    };

                    logger.debug(spaces + scriptName + ' Returning ....');
                    return ({"s2mResponse":s2mResponse, "verificationStatus" : jsonResponse.verificationStatus});
                })
                .catch(function (err) {
                    logger.error(spaces + " Error: " +  JSON.stringify(err));
                    var httpResponseOptions = {};
                    httpResponseOptions.message = err.message;

                    var s2mResponse = new S2mResponse('FAILURE_QUIZ',httpResponseOptions);
                    // var s2mResponse = new S2mResponse('FAILURE_QUIZ', {"message" : err.message});
                    var verificationStatus = {"status": "Error",
                                              "reason" : err.message};
                    logger.debug(spaces + scriptName + ' Returning ....');
                    return ({"s2mResponse":s2mResponse, "verificationStatus" : verificationStatus});
                });
        })
        .catch(function (err) {
            logger.error(spaces + "Error: " + JSON.stringify(err));
            //var objs = {};
            //objs.internal = err.message;
            //var s2mResponse = new S2mResponse('REMOTE_ERR_LEXISNEXIS',objs);

            var verificationStatus = {"status": "Error",
                "reason" : err.message};

            var httpResponseOptions = {};
            httpResponseOptions.internalMessage = {"internal" : "no",
                "script" : scriptName,
                "processStep" : "VERIFY_IDENTITY",
                "message " : "External Service Error :" + err.message};
            httpResponseOptions.errorCode = "REMOTE-SERVICE-ERROR";
            var s2mResponse = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
            logger.debug(spaces + scriptName + ' Returning ....');
            return ({"s2mResponse":s2mResponse, "verificationStatus" : verificationStatus});
        });
};

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        logger.error('No Appicant Transaction found in request object');
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {"internal" : "yes",
            "script" : scriptName,
            "processStep" : "VERIFY_IDENTITY",
            "message" :  "No Appicant Transaction found in request object"};
        httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
        req.s2mResponse  = new S2mResponse('SERVICE_ERROR', httpResponseOptions);

        logger.debug(scriptName + ' Continue ....');
        next();

    };
    
    if(req.applicantTransaction.quizRequired()) {
        var questionSetId = req.body.questionSetId || undefined;
        
        if(_.isNil(questionSetId)) {
            getQuestions(req).then(function(response) {
                var s2mResponse         = response.s2mResponse || undefined;
                var verificationStatus  = response.verificationStatus || undefined;
                var responseStatus          = 'failure';
                if(_.isNil(s2mResponse) || _.isNil(verificationStatus)) {

                    //req.s2mResponse = new S2mResponse('INTERNAL_ERR');
                    verificationStatus = {"status": "error",
                                          "reason" : "No Verification Status"};
                    var httpResponseOptions = {};
                    httpResponseOptions.internalMessage = {"internal" : "yes",
                        "script" : scriptName,
                        "processStep" : "VERIFY_IDENTITY",
                        "message" :  "No Verification Status, Request to service failed"};
                    httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
                    req.s2mResponse  = new S2mResponse('SERVICE_ERROR', httpResponseOptions);

                }
                else {
                    responseStatus          = response.verificationStatus.status;
                    responseStatus          = responseStatus.toString().toLowerCase();
                    req.s2mResponse = s2mResponse;
                };
                
                /*if(req.s2mResponse.hasQuestions()) {
                    req.performedSteps.identity_quiz = "yes";
                }
                else {
                  req.performedSteps.identity_quiz = "no";
                }*/

                db.saveVerificationStepStatus(req.applicantTransaction.getId(), verificationStatus, responseStatus, 'identity_verification').then(function(result) {
                    if(!_.isNil(result)) {
                        req.applicantTransaction.setIdentityVerification(verificationStatus);
                        req.applicantTransaction.setIdentityVerificationStatus(responseStatus);
                        req.applicantTransaction.setUpdateDate(new Date);
                    }
                    else {
                        //TODO need to log error
                        logger.error(spaces + 'Applicant Transaction Record was not update for identity_verification');
                    }
                    logger.debug(scriptName + ' Continue ....');
                    next();
                });
            });
        }
        else {
            answerQuestions(req).then(function(response) {
                //req.performedSteps.identity_quiz = "no";
                var s2mResponse         = response.s2mResponse || undefined;
                var verificationStatus  = response.verificationStatus || undefined;
                var responseStatus          = 'failure';
                if(_.isNil(s2mResponse) && _.isNil(verificationStatus)) {
                   // req.s2mResponse = new S2mResponse('INTERNAL_ERR');
                    verificationStatus = {"status": "error",
                        "reason" : "No Verification Status. Request to service failed"};
                    var httpResponseOptions = {};
                    httpResponseOptions.internalMessage = {"internal" : "yes",
                        "script" : scriptName,
                        "processStep" : "VERIFY_IDENTITY",
                        "message" :  "No Verification Status, Request to service failed"};
                    httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
                    req.s2mResponse  = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
                }
                else {
                    responseStatus          = response.verificationStatus.status;
                    responseStatus          = responseStatus.toString().toLowerCase();

                    req.s2mResponse = s2mResponse;
                };
                db.saveVerificationStepStatus(req.applicantTransaction.getId(), verificationStatus, responseStatus, 'identity_verification').then(function(result) {
                    if(!_.isNil(result)) {
                        req.applicantTransaction.setIdentityVerification(verificationStatus);
                        req.applicantTransaction.setIdentityVerificationStatus(responseStatus);
                        req.applicantTransaction.setUpdateDate(new Date);
                    }
                    else {
                        //TODO need to log error
                        logger.error(spaces + 'Applicant Transaction Record was not update for identity_verification');
                    }
                    logger.debug(scriptName + ' Continue ....');
                    next();
                });
            });
        };
    }
    else {
        //req.performedSteps.identity_quiz = "no";
        logger.debug(scriptName + ' Continue ....');
        next();
    };
};
