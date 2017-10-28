var _ = require('lodash');
var S2mResponse = require('../common/s2mHttpResponse');
var db = require("../helpers/mysql-helper");
var onfido = require('../helpers/onfido-helper');
var logger = require('../helpers/log-helper');
var config = require('config');
var onfidoConfig = config.get('Onfido.config');

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        //req.s2mResponse  = new S2mResponse('INTERNAL_ERR_NO_TRANSACTION');
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {"internal" : "yes",
            "script" : scriptName,
            "processStep" : "SEX_OFFENDER",
            "message" :  "No Appicant Transaction found in request object"};
        httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
        req.s2mResponse  = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
        logger.debug(scriptName + ' Continue ....');
        next();

    };
    if(onfidoConfig.active == false) {
        logger.debug('Onfido service is set to not active');
        logger.debug(scriptName + ' Continue ....');
        next();
    }
    else if ((req.applicantTransaction.sexOffenderVerificationRequired()) || (req.subscribeReq ==  "yes"))  {

        onfido.getReport(req.applicantTransaction.getHrefId(),'sex_offender').then(function (response) {

            var s2mResponse = response.s2mResponse || undefined;
            var httpResponse = response.httpResponse || undefined;
            var sexOffenderVerificationJSON = {};

            var responseStatus          = 'failure';
            if (_.isNil(s2mResponse)) {
                responseStatus = 'success';
                sexOffenderVerificationJSON.serviceResponse = httpResponse.reports[0];
                sexOffenderVerificationJSON.breakdown       = httpResponse.reports[0].breakdown;
            }
            else {
                req.s2mResponse = s2mResponse;
            };
            /*if(!_.isNil(req.s2mResponse)) {
                var httpStatusCode = req.s2mResponse.getHttpStatusCode() || 500;

                if((httpStatusCode == 404) || (httpStatusCode >= 500)) {
                    req.performedSteps.sex_offender_check = "no";
                }
                else {
                    req.performedSteps.sex_offender_check = "yes"
                };
            }
            else {
                req.performedSteps.sex_offender_check = "yes";
            };*/

            db.saveVerificationStepStatus(req.applicantTransaction.getId(), sexOffenderVerificationJSON, responseStatus, 'sex_offender_verification','onfido').then(function(result) {
                if(!_.isNil(result)) {
                    req.applicantTransaction.setSexOffenderVerification(sexOffenderVerificationJSON);
                    req.applicantTransaction.setSexOffenderVerificationStatus(responseStatus);
                    req.applicantTransaction.setUpdateDate(new Date);
                    req.applicantTransaction.setSexOffenderSource('onfido');
                }
                else {
                    //TODO need to log error
                    logger.error(spaces + 'Applicant Transaction Record was not update for ssn_verification');
                };
                db.saveVerificationStepStatus(req.applicantTransaction.getId(), sexOffenderVerificationJSON, responseStatus, 'sex_offender_verification').then(function(result) {
                    logger.debug('double call to saveVerificationStepStatus....');
                    logger.debug(scriptName + ' Continue ....');
                    next();
                });

            });
        });
    }
    else {
       // req.performedSteps.sex_offender_check = "no";
        logger.debug(scriptName + ' Continue ....');
        next();
    };

};


