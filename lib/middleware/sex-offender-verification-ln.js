var Promise = require('bluebird');
var _ = require('lodash');
var config = require('config');
var lexisNexisConfig = config.get('LexisNexis.config');
var lexisnexisHelper = Promise.promisifyAll(require('../helpers/lexisnexis-helper'));
var rp = require('request-promise');
var db = require("../helpers/mysql-helper");
var S2mResponse = require('../common/s2mHttpResponse');
var logger = require('../helpers/log-helper');
var lexisNexisConfig = config.get('LexisNexis.sexOffenderConfig');

function getLexisSexOffenderBackground(ssn) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    logger.debug(scriptName + ' Starting ....');
    var options = {};
    var noDashSsn  = ssn.replace(/-/g,'');
    var fullUrl = lexisNexisConfig.url + noDashSsn;
    var auth = new Buffer(lexisNexisConfig.accountName).toString("base64");
    options = {
        url : fullUrl,
        method : 'GET',
        headers : { 'Authorization' : 'Basic ' + auth, },
        //body: params,
        simple: true,
        json: true
    };
    logger.debug('LexisSexOffender Request : ' +  JSON.stringify(options));
    return  rp(options)
        .then(function (sexOffenderHttpResponse) {
            logger.debug(sexOffenderHttpResponse);
            return  lexisnexisHelper.response2jsonSexOffenderAsync(sexOffenderHttpResponse)
                .then(function(jsonResponse) {
                    logger.debug(jsonResponse);
                    var httpResponse = {};
                    httpResponse.recordCount = jsonResponse.recordCount;
                    httpResponse.status = jsonResponse.status;
                    httpResponse.message = jsonResponse.verificationStatus.reason;
                    httpResponse.responseBody = jsonResponse.responseBody;

                    var s2mResponse = undefined;

                   /* if(httpResponse.message.includes("No Records found for SSN")) {
                        var httpResponseOptions = {};
                        httpResponseOptions.internalMessage = {"internal" : "no",
                            "script" : scriptName,
                            "processStep" : "SEX_OFFENDER",
                            "message" : "No Records found for SSN"};
                        httpResponseOptions.message = "No Records found for SSN";
                        var s2mResponse = new S2mResponse('FAILURE_SEX_OFFENDER', httpResponseOptions);


                    }*/


                    logger.debug(scriptName + ' Returning ....');
                    //return ({"s2mResponse": s2mResponse, "verificationStatus": jsonResponse.verificationStatus});
                    //return {"httpResponse": httpResponse};
                    return {"httpResponse" : httpResponse, "s2mResponse" : s2mResponse};
                }).catch(function (err) {
                    logger.info(spaces + " Error: " + JSON.stringify(err.message));
                    //var objs = {};
                    //objs.internal = err.message
                    //var s2mResponse = new S2mResponse('FAILURE_IDENTITY-NOT-FOUND', objs);
                    var verificationStatus = {"status": "Error",
                        "reason" : err.message};
                    var httpResponseOptions = {};

                    httpResponseOptions.internalMessage = {"internal" : "no",
                        "script" : scriptName,
                        "processStep" : "SEX_OFFENDER",
                        "message" : err.message};
                    httpResponseOptions.message = err.message || "External Service Error";
                    var s2mResponse = new S2mResponse('FAILURE_SEX_OFFENDER',httpResponseOptions);
                    logger.debug( scriptName + ' Returning ....');
                    return ({"s2mResponse":s2mResponse, "verificationStatus" : verificationStatus});
                });

        }).catch(function (httpResponse) {
            logger.debug(JSON.stringify(httpResponse));
            var httpResponseOptions = {};
            httpResponseOptions.internalMessage = {"internal" : "no",
                "script" : scriptName,
                "processStep" : "SEX_OFFENDER",
                "message" :  httpResponse.message};
            httpResponseOptions.message = "External Service Error";
            httpResponseOptions.errorCode = "SERVICE_ERROR";
            httpResponseOptions.message = 'Error in getting Sex Offender Search Report';
            var s2mResponse  = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
            logger.debug(scriptName + ' Ending .... ');
            return {"httpResponse" : undefined, "s2mResponse" : s2mResponse};
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
    if(lexisNexisConfig.active == false) {
        logger.debug('LexisNexis Sex Offender Background service is set to not active');
        logger.debug(scriptName + ' Continue ....');
        next();
    }
    else if ((applicantTransaction.sexOffenderVerificationRequired()) || (req.subscribeReq ==  "yes"))  {
        getLexisSexOffenderBackground(req.ssn).then(function(response) {
            logger.debug("sex offender response : " + JSON.stringify(response));

            var s2mResponse = response.s2mResponse || undefined;
            var httpResponse = response.httpResponse || undefined;
            var nationalCriminalVerificationJSON = {};
            var responseStatus          = 'failure';
            if (_.isNil(s2mResponse)) {
                responseStatus = 'success';
                //nationalCriminalVerificationJSON.serviceResponse = httpResponse.reports[0];
                //nationalCriminalVerificationJSON.breakdown       = httpResponse.reports[0].breakdown;
            }
            else {
                req.s2mResponse = s2mResponse;
                logger.debug('s2mResponse : '  + JSON.stringify(req.s2mResponse));
            };

            db.saveVerificationStepStatus(req.applicantTransaction.getId(), httpResponse, responseStatus, 'sex_offender_verification','lexis-nexis').then(function(result) {
                if(!_.isNil(result)) {
                    req.applicantTransaction.setSexOffenderVerification(httpResponse);
                    req.applicantTransaction.setSexOffenderVerificationStatus(responseStatus);
                    req.applicantTransaction.setUpdateDate(new Date);
                    req.applicantTransaction.setSexOffenderSource('lexis-nexis');
                }
                else {

                    logger.error(spaces + 'Applicant Transaction Record was not update for Sex Offender Background Verification');
                }
                logger.debug(scriptName + ' Continue ....');
                next();
            });
        });
    }
    else {
        //req.performedSteps.national_crime_check = "no";
        logger.debug(scriptName + ' Continue ....');
        next();
    };
};
