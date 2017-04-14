var _ = require('lodash');
var rp = require('request-promise');
var S2mResponse = require('../common/s2mHttpResponse');
var ApplicantTransaction = require("../common/ApplicantTransaction");
//var config = require('config');
//var onfidoConfig = config.get('Onfido.config');
//var securityConfig = config.get('Security.config');
var db = require("../helpers/mysql-helper");
var dateFormat = require('date-format');
var logger = require('../helpers/log-helper');


function identityVerifiedComplete(applicantTransaction) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    logger.debug(scriptName + ' Starting ....');
    var response = {}
    response.identityVerified = true;
    response.message = null;

    if(applicantTransaction.ssnTraceRequired()) {
        response.identityVerified = false;
        response.message = 'SSN Trace not completed';

    }
    else if(applicantTransaction.quizRequired()) {
        response.identityVerified = false;
        response.message = 'Identity Quiz Not completed';
    }
    logger.debug(scriptName + ' Ending .... ');
    return response;
}

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.main';
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        //req.s2mResponse  = new S2mResponse('INTERNAL_ERR_NO_TRANSACTION');
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {"internal" : "yes",
            "script" : scriptName,
            "processStep" : "UPDATE_APPLICANT",
            "message" :  "No Appicant Transaction found in request object"};
        httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
        req.s2mResponse  = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
        logger.debug(scriptName + ' Continue ....');
        next();

    };
    var identityVerified = identityVerifiedComplete(applicantTransaction);
    if(!identityVerified.identityVerified) {
        logger.debug(scriptName + ' Calling Update/refresh before User :' + applicantTransaction.getApplicantRefId() + " has completed Identity verification step :" + identityVerified.message);
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {
            "internal": "yes",
            "script": scriptName,
            "processStep": "IDENTITY_UPDATE",
            "message": "User has not success completed Identity Verification. " + identityVerified.message
        };
        httpResponseOptions.errorCode = "ID_VERIFICATION_NOT_COMPLETE";
        req.s2mResponse = new S2mResponse('ID_VERIFICATION_NOT_COMPLETE', httpResponseOptions);

    }
    next();

};
