
var _ = require('lodash');
var rp = require('request-promise');
var S2mResponse = require('../common/s2mHttpResponse');
var config = require('config');
var onfidoConfig = config.get('Onfido.config');
var dateFormat = require('date-format');
var db = require("../helpers/mysql-helper");
var logger = require('../helpers/log-helper');
var onfido = require('../helpers/onfido-helper');

/*nationalCriminalVerification = function(applicantId) {

    var params = {
        type : 'express',
        reports :[]
    };

    params.reports.push({name : 'national_criminal'});

    //var applicantId = req.requestParams.id;
    var options = {};
    var fullUrl = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.path + '/' + applicantId  + onfidoConfig.checks;
    var path = onfidoConfig.path + '/' +  applicantId   +  onfidoConfig.checks;
    console.log(path);
    options = {
        url : fullUrl,
        method : 'POST',
        headers : { 'Authorization': 'Token token=' + process.env.ONFIDO_APIKEY_ID, 'host': onfidoConfig.host, 'path': path, },
        body: params,
        json: true
    };
    return  rp(options)
        .then(function (httpResponse) {
            logger.debug('National Criminal Verification Response :' + JSON.stringify(httpResponse));
            return  {"httpResponse" : httpResponse};
        }).
        catch(function(httpResponse) {
            //TODO need to log error
            logger.debug('National Criminal Verification Response :' + JSON.stringify(httpResponse));
            var s2mResponse = new S2mResponse('FAILED_INVALID_REQUEST');
            return {"httpResponse" : httpResponse,  "s2mResponse" : s2mResponse};
        });
};*/

saveNationalCriminalVerification = function(req, nationalCriminalVerificationJSON) {

    var query = 'update applicant_transaction ' +
        'set national_criminal_verification = ? ,' +
        ' update_date = ? ' +
        ' where id = ?';

    var now = new Date();
    var params = [];

    params.push(JSON.stringify(nationalCriminalVerificationJSON));
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
    params.push(req.applicantTransaction.getId());


    return db.update(query, params).then(function(result) {
        if(!_.isNil(result)) {
            req.applicantTransaction.setNationalCriminalVerification(nationalCriminalVerificationJSON);
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

    if (req.applicantTransaction.requiresNationalCriminalVerification()) {

        onfido.getReport(req.applicantTransaction.getHrefId(), 'national_criminal').then(function(response) {

            var s2mResponse = response.s2mResponse || undefined;
            var httpResponse = response.httpResponse || undefined;
            var nationalCriminalVerificationJSON = {};
            nationalCriminalVerificationJSON.serviceResponse = httpResponse.reports[0];
            nationalCriminalVerificationJSON.breakdown       = httpResponse.reports[0].breakdown;
            nationalCriminalVerificationJSON.responseStatus          = 'failure';
            if (_.isNil(s2mResponse)) {
                nationalCriminalVerificationJSON.responseStatus = 'success';
            }
            else {
                req.s2mResponse = s2mResponse;
            };
            saveNationalCriminalVerification(req, nationalCriminalVerificationJSON).then (function(results) {
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

