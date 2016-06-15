var _ = require('lodash');
var S2mResponse = require('../common/s2mHttpResponse');
var db = require("../helpers/mysql-helper");
var logger = require('../helpers/log-helper');
var onfido = require('../helpers/onfido-helper');

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        logger.error('No Appicant Transaction found in request object');
        req.s2mResponse  = new S2mResponse('INTERNAL_ERR_NO_TRANSACTION');
        logger.debug(scriptName + ' Continue ....');
        next();

    };

    if (req.applicantTransaction.ssnTraceRequired()) {

        //ssnTrace(req.requestParams.id).then(function(response) {
        onfido.getReport(req.requestParams.id,'ssn_trace').then(function(response) {
            var s2mResponse = response.s2mResponse || undefined;
            var httpResponse = response.httpResponse || undefined;
            var ssnVerificationJson = {};
            //TODO
            ssnVerificationJson.serviceResponse = httpResponse.reports[0];
            ssnVerificationJson.breakdown       = httpResponse.reports[0].breakdown;
            var responseStatus          = 'failure';
            if (_.isNil(s2mResponse)) {
                if (httpResponse.result == 'clear' || (httpResponse.result == 'consider' && req.appInfo.ssnTraceAcceptConsider)) {
                    responseStatus = 'success';
                }
                else {
                    req.s2mResponse = new S2mResponse('FAILURE_SSN_TRACE');
                };
            }
            else {
                req.s2mResponse = s2mResponse;
            };
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
        })
    }
    else {
        logger.debug(scriptName + ' Continue ....');
        next();
    }
};    

