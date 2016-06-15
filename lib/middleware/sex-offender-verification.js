var _ = require('lodash');
var S2mResponse = require('../common/s2mHttpResponse');
var db = require("../helpers/mysql-helper");
var onfido = require('../helpers/onfido-helper');
var logger = require('../helpers/log-helper');


module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        req.s2mResponse  = new S2mResponse('INTERNAL_ERR_NO_TRANSACTION');
        logger.debug(scriptName + ' Continue ....');
        next();

    };

    if (req.applicantTransaction.sexOffenderVerificationRequired()) {

        onfido.getReport(req.applicantTransaction.getHrefId(),'sex_offender').then(function (response) {

            var s2mResponse = response.s2mResponse || undefined;
            var httpResponse = response.httpResponse || undefined;
            var sexOffenderVerificationJSON = {};
            sexOffenderVerificationJSON.serviceResponse = httpResponse.reports[0];
            sexOffenderVerificationJSON.breakdown       = httpResponse.reports[0].breakdown;
            var responseStatus          = 'failure';
            if (_.isNil(s2mResponse)) {
                responseStatus = 'success';
            }
            else {
                req.s2mResponse = s2mResponse;
            };

            db.saveVerificationStepStatus(req.applicantTransaction.getId(), sexOffenderVerificationJSON, responseStatus, 'sex_offender_verification').then(function(result) {
                if(!_.isNil(result)) {
                    req.applicantTransaction.setSexOffenderVerification(sexOffenderVerificationJSON);
                    req.applicantTransaction.setSexOffenderVerificationStatus(responseStatus);
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
            logger.debug(scriptName + ' Continue ....');
            next();
    };

};


