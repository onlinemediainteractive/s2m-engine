var _ = require('lodash');
var S2mResponse = require('../common/s2mHttpResponse');
var db = require("../helpers/mysql-helper");
var logger = require('../helpers/log-helper');
var onfido = require('../helpers/onfido-helper');
var utils = require('../common/utils');

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        logger.error('No Appicant Transaction found in request object');
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {"internal" : "yes",
            "script" : scriptName,
            "processStep" : "SSN_TRACE",
            "message" :  "No Appicant Transaction found in request object"};
        httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
        req.s2mResponse  = new S2mResponse('SERVICE_ERROR', httpResponseOptions);

        logger.debug(scriptName + ' Continue ....');
        next();

    };

    if (req.applicantTransaction.ssnTraceRequired()) {

        //ssnTrace(req.requestParams.id).then(function(response) {
        onfido.getReport(req.requestParams.id,'ssn_trace').then(function(response) {
            var s2mResponse = response.s2mResponse || undefined;
            var httpResponse = response.httpResponse || undefined;
            var ssnVerificationJson = {};

            ssnVerificationJson.serviceResponse = httpResponse.reports[0];
            ssnVerificationJson.breakdown       = httpResponse.reports[0].breakdown;
            var responseStatus          = 'failure';
            if (_.isNil(s2mResponse)) {
                if (httpResponse.result == 'clear' || (httpResponse.result == 'consider' && req.appInfo.ssnTraceAcceptConsider)) {
                    responseStatus = 'success';
                   // if((process.env.NODE_ENV == 'development') && (req.applicantTransaction.getSsn().substring(4,6) == '99')) {
                    if(!utils.isProduction() && (req.applicantTransaction.getSsn().substring(4,6) == '99')) {
                        logger.info('SSN with a middle digits of 99 fail in development mode');
                        var httpResponseOptions = {};
                        httpResponseOptions.internalMessage = {"internal" : "yes",
                            "script" : scriptName,
                            "processStep" : "SSN_TRACE",
                            "message" :  'SSN with a middle digits of 99 fail in development mode'};
                        req.s2mResponse = new S2mResponse('APPLICANT_VALIDATION_FAILURE', httpResponseOptions);
                        responseStatus = 'failure';
                    }
                }
                else {
                    var httpResponseOptions = {};
                    httpResponseOptions.internalMessage = {"internal" : "yes",
                        "script" : scriptName,
                        "processStep" : "SSN_TRACE",
                        "message" :  'SSN trace failed'};
                    req.s2mResponse = new S2mResponse('FAILURE_SSN_TRACE',httpResponseOptions);
                };
            }
            else {
                req.s2mResponse = s2mResponse;
            };

            /*if(!_.isNil(req.s2mResponse)) {
                var httpStatusCode = req.s2mResponse.getHttpStatusCode() || 500;

                if((httpStatusCode == 404) || (httpStatusCode >= 500)) {
                  req.performedSteps.ssn_trace = "no";
                }
                else {
                  req.performedSteps.ssn_trace = "yes"
                };
            }
            else {
                req.performedSteps.ssn_trace = "yes";
            };*/
            db.saveVerificationStepStatus(req.applicantTransaction.getId(), ssnVerificationJson, responseStatus, 'ssn_verification').then(function(result) {
                if(!_.isNil(result)) {
                    req.applicantTransaction.setSsnVerification(ssnVerificationJson);
                    req.applicantTransaction.setSsnVerificationStatus(responseStatus);
                    req.applicantTransaction.setUpdateDate(new Date);
                }
                else {
                    //TODO need to log error
                    logger.error(spaces + 'Applicant Transaction Record was not update for ssn_verification');
                };
                logger.debug(scriptName + ' Continue ....');
                next();
            });
        });
    }
    else {
        req.performedSteps.ssn_trace = "no";
        logger.debug(scriptName + ' Continue ....');
        next();
    }
};    

