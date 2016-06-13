var _ = require('lodash');
var rp = require('request-promise');
var S2mResponse = require('../common/s2mHttpResponse');
var config = require('config');
var onfidoConfig = config.get('Onfido.config');
var dateFormat = require('date-format');
var db = require("../helpers/mysql-helper");
var onfido = require('../helpers/onfido-helper');
var logger = require('../helpers/log-helper');


saveSexOffenderVerification = function(req, sexOffenderVerificationJSON) {

    var query = 'update applicant_transaction ' +
        'set sex_offender_verification = ? ,' +
        ' update_date = ? ' +
        ' where id = ?';

    var now = new Date();
    var params = [];

    params.push(JSON.stringify(sexOffenderVerificationJSON));
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
    params.push(req.applicantTransaction.getId());


    return db.update(query, params).then(function(result) {
        if(!_.isNil(result)) {
            req.applicantTransaction.setSexOffenderVerification(sexOffenderVerificationJSON);
            req.applicantTransaction.setUpdateDate(now);
        }
        else {
            //TODO need to log error
            logger.error('Applicant Transaction Record was not update for sex_offender');
        }
        return result;
    });
};

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        req.s2mResponse  = new S2mResponse('INTERNAL_ERR_NO_TRANSACTION');
        logger.debug(scriptName + ' Continue ....');
        next();

    };

    if (req.applicantTransaction.requiresSexOffenderVerification()) {

        onfido.getReport(req.applicantTransaction.getHrefId(),'sex_offender').then(function (response) {

            var s2mResponse = response.s2mResponse || undefined;
            var httpResponse = response.httpResponse || undefined;
            var sexOffenderVerificationJSON = {};
            sexOffenderVerificationJSON.serviceResponse = httpResponse.reports[0];
            sexOffenderVerificationJSON.breakdown       = httpResponse.reports[0].breakdown;
            sexOffenderVerificationJSON.responseStatus          = 'failure';
            if (_.isNil(s2mResponse)) {
                sexOffenderVerificationJSON.responseStatus = 'success';
            }
            else {
                req.s2mResponse = s2mResponse;
            };
            saveSexOffenderVerification(req, sexOffenderVerificationJSON).then(function (results) {
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


