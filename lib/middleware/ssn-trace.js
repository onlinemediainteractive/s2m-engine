
var _ = require('lodash');
var rp = require('request-promise');
var S2mResponse = require('../common/s2mHttpResponse');
var dateFormat = require('date-format');
var db = require("../helpers/mysql-helper");
var logger = require('../helpers/log-helper');
var onfido = require('../helpers/onfido-helper');


saveSsnVerification = function(req, ssnVerificationJson) {

    var query = 'update applicant_transaction ' +
        'set ssn_verification = ? ,' +
        ' update_date = ? ' +
        ' where id = ?';

    var now = new Date();
    var params = [];

    params.push(JSON.stringify(ssnVerificationJson));
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
    params.push(req.applicantTransaction.getId());


    return db.update(query, params).then(function(result) {
        if(!_.isNil(result)) {
            req.applicantTransaction.setSsnVerification(ssnVerificationJson);
            req.applicantTransaction.setUpdateDate(now);
        }
        else {
            //TODO need to log error
            logger.error('Applicant Transaction Record was not update for ssn_verification');
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

    if (req.applicantTransaction.ssnTraceRequired()) {

        //ssnTrace(req.requestParams.id).then(function(response) {
        onfido.getReport(req.requestParams.id,'ssn_trace').then(function(response) {
            var s2mResponse = response.s2mResponse || undefined;
            var httpResponse = response.httpResponse || undefined;
            var ssnVerificationJson = {};
            //TODO
            ssnVerificationJson.serviceResponse = httpResponse.reports[0];
            ssnVerificationJson.breakdown       = httpResponse.reports[0].breakdown;
            ssnVerificationJson.responseStatus          = 'failure';
            if (_.isNil(s2mResponse)) {
                if (httpResponse.result == 'clear' || (httpResponse.result == 'consider' && req.appInfo.ssnTraceAcceptConsider)) {
                    ssnVerificationJson.responseStatus = 'success';
                }
                else {
                    req.s2mResponse = new S2mResponse('FAILURE_SSN_TRACE');
                };
            }
            else {
                req.s2mResponse = s2mResponse;
            };
            saveSsnVerification(req, ssnVerificationJson).then (function(results) {
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

