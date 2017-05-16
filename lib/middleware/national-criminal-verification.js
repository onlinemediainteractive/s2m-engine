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
        //req.s2mResponse  = new S2mResponse('INTERNAL_ERR_NO_TRANSACTION');
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {"internal" : "yes",
            "script" : scriptName,
            "processStep" : "NATIONAL_CRIMINAL",
            "message" :  "No Appicant Transaction found in request object"};
        httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
        logger.debug(scriptName + ' Continue ....');
        next();

    };

    if ((req.applicantTransaction.nationalCriminalVerificationRequired()) || (req.subscribeReq ==  "yes")) {

        onfido.getReport(req.applicantTransaction.getHrefId(), 'national_criminal').then(function(response) {

            var s2mResponse = response.s2mResponse || undefined;
            var httpResponse = response.httpResponse || undefined;
            var nationalCriminalVerificationJSON = {};
            //nationalCriminalVerificationJSON.serviceResponse = httpResponse.reports[0];
            //nationalCriminalVerificationJSON.breakdown       = httpResponse.reports[0].breakdown;
            var responseStatus          = 'failure';
            if (_.isNil(s2mResponse)) {
                responseStatus = 'success';
                nationalCriminalVerificationJSON.serviceResponse = httpResponse.reports[0];
                nationalCriminalVerificationJSON.breakdown       = httpResponse.reports[0].breakdown;
            }
            else {
                req.s2mResponse = s2mResponse;
                logger.debug('s2mResponse : '  + JSON.stringify(req.s2mResponse));
            };
            /*if(!_.isNil(req.s2mResponse)) {
                var httpStatusCode = req.s2mResponse.getHttpStatusCode() || 500;

                if((httpStatusCode == 404) || (httpStatusCode >= 500)) {
                    req.performedSteps.national_crime_check = "no";
                }
                else {
                    req.performedSteps.national_crime_check = "yes"
                };
            }
            else {
                req.performedSteps.national_crime_check = "yes";
            };*/
            db.makeVerificationBackup(req.applicantTransaction.getId(), req.subscribeReq).then(function(insertResult) {
                logger.error('history Id :' + insertResult);
                db.saveVerificationStepStatus(req.applicantTransaction.getId(), nationalCriminalVerificationJSON, responseStatus, 'national_criminal_verification').then(function(result) {
                    if(!_.isNil(result)) {
                        req.applicantTransaction.setNationalCriminalVerification(nationalCriminalVerificationJSON);
                        req.applicantTransaction.setNationalCriminalVerificationStatus(responseStatus);
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

        });
    }
    else {
        //req.performedSteps.national_crime_check = "no";
        logger.debug(scriptName + ' Continue ....');
        next();
    };

};

