var Promise = require('bluebird');
var _ = require('lodash');
var config = require('config');
var lexisNexisConfig = config.get('LexisNexis.config');
var lexisnexisHelper = Promise.promisifyAll(require('../helpers/lexisnexis-helper'));
var rp = require('request-promise');
var db = require("../helpers/mysql-helper");
var dateFormat = require('date-format');
var S2mResponse = require('../common/s2mHttpResponse');
var logger = require('../helpers/log-helper');


getQuestions = function(req) {

    var auth = new Buffer(process.env.LEXIS_NEXIS_USER + ":" + process.env.LEXIS_NEXIS_PASSWORD).toString("base64");

    var soapUrl = lexisNexisConfig.url + lexisNexisConfig.wsdlPath;
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
            return  lexisnexisHelper.response2jsonAsync(httpResponse)
                .then(function(jsonResponse) {
                    var questionResponse = {};
                    questionResponse.transactionId = jsonResponse.transactionId;
                    questionResponse.questionSetId = jsonResponse.questionSetId;
                    questionResponse.questions     = jsonResponse.questions;

                    var s2mResponse = new S2mResponse('SUCCESS_RETURN_QUESTION',{"message" : jsonResponse.message, "questions" : questionResponse});
                    if(req.appInfo.isDevelopmentMode()) {
                        logger.debug('Answer Response:' + JSON.stringify(jsonResponse.testResponse));
                    }
                    return ({"s2mResponse":s2mResponse, "verificationStatus" : jsonResponse.verificationStatus });
                })
                .catch(function (err) {
                    logger.error(err);
                    var s2mResponse = new S2mResponse('FAILURE_QUIZ', err.message);
                    var verificationStatus = {"status": "Error",
                                             "reason" : err.message};
                    return ({"s2mResponse":s2mResponse, "verificationStatus" : verificationStatus});
                });
        })
        .catch(function (err) {
            logger.error(err);
            var s2mResponse = new S2mResponse('REMOTE_ERR_LEXISNEXIS');
            var verificationStatus = {"status": "Error",
                                      "reason" : err.message};
            return ({"s2mResponse":s2mResponse,  "verificationStatus" : verificationStatus});
        });
};

saveVerifyIdentity = function(req, verifyIdentityJson) {

    var query = 'update applicant_transaction ' +
        'set identity_verification = ? ,' +
        ' update_date = ? ' +
        ' where id = ?';

    var now = new Date();
    var params = [];

    params.push(JSON.stringify(verifyIdentityJson));
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
    params.push(req.applicantTransaction.getId());


    return db.update(query, params).then(function(result) {
        if(!_.isNil(result)) {
            req.applicantTransaction.setIdentityVerification(verifyIdentityJson);
            req.applicantTransaction.setUpdateDate(now);
        }
        else {
            //TODO need to log error
            logger.error('Applicant Transaction Record was not update for identity_verification');
        };
        return result;
    });
};

answerQuestions = function(req) {

    var auth = new Buffer(process.env.LEXIS_NEXIS_USER + ":" + process.env.LEXIS_NEXIS_PASSWORD).toString("base64");

    var params = req.body;

    var soapParams = {};
    soapParams.transactionId = params.transactionId;
    soapParams.questionSetId = params.questionSetId;
    soapParams.answers       = params.answers;

    var soapBody = lexisnexisHelper.parseVerificationAnswerBody(soapParams)
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
        .then(function (response) {
            return  lexisnexisHelper.response2jsonAsync(response)
                .then(function(jsonResponse) {
                    // could be a second set of questions
                    var s2mResponse = new S2mResponse('SUCCESS_QUIZ',{"message" : jsonResponse.message});
                    return ({"s2mResponse":s2mResponse, "verificationStatus" : jsonResponse.verificationStatus});
                })
                .catch(function (err) {
                    var s2mResponse = new S2mResponse('FAILURE_QUIZ', {"message" : err.message});
                    var verificationStatus = {"status": "Error",
                                              "reason" : err.message};
                    return ({"s2mResponse":s2mResponse, "verificationStatus" : verificationStatus});
                });
        })
        .catch(function (err) {
            logger.error("error: " + JSON.stringify(err));
            var s2mResponse = new S2mResponse('REMOTE_ERR_LEXISNEXIS');
            var verificationStatus = {"status": "Error",
                "reason" : err.message};
            return ({"s2mResponse":s2mResponse, "verificationStatus" : verificationStatus});
        });
};

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        req.s2mResponse = new S2mResponse('INERNAL_ERR_NO_TRANSACTION');
        logger.debug(scriptName + ' Continue ....');
        next();
    };
    
    if(req.applicantTransaction.requiresQuiz()) {
        var questionSetId = req.body.questionSetId || undefined;
        
        if(_.isNil(questionSetId)) {
            getQuestions(req).then(function(response) {
                var s2mResponse         = response.s2mResponse || undefined;
                var verificationStatus  = response.verificationStatus || undefined;

                if(_.isNil(s2mResponse) || _.isNil(verificationStatus)) {
                    req.s2mResponse = new S2mResponse(INTERNAL_ERR);
                    verificationStatus = {"status": "Error",
                                          "reason" : "No Verification Status"};
                }
                else {
                    req.s2mResponse = s2mResponse;
                };
                saveVerifyIdentity(req, verificationStatus).then(function(result) {
                    logger.debug(scriptName + ' Continue ....');
                    next();
                });
            });
        }
        else {
            answerQuestions(req).then(function(response) {
                var s2mResponse         = response.s2mResponse || undefined;
                var verificationStatus  = response.verificationStatus || undefined;
                if(_.isNil(s2mResponse) || _.isNil(verificationStatus)) {
                    req.s2mResponse = new S2mResponse(INTERNAL_ERR);
                    verificationStatus = {"status": "Error",
                        "reason" : "No Verification Status"};
                }
                else {
                    req.s2mResponse = s2mResponse;
                };
                saveVerifyIdentity(req, verificationStatus).then(function(result) {
                    logger.debug(scriptName + ' Continue ....');
                    next();
                });
            });
        };
    }
    else {
        logger.debug(scriptName + ' Continue ....');
        next();
    };
};
