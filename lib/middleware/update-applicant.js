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
var onfido = require('../helpers/onfido-helper');
var encrypt = require('../helpers/encrypt-helper');
//var utils = require('../commons/utils');


function updateApplicantTransaction(applicantTransaction) {

    var query = 'update applicant_transaction ' +
                ' set verifications = ? ,' +
                ' activities = ? ,' +
                ' update_date = ? ' +
                ' where id = ?' ;
    var params = [];
    var now = new Date();

    params.push(applicantTransaction.getVerifications());
    params.push(applicantTransaction.getActivities());
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
    params.push(applicantTransaction.getId());


    return db.update(query, params).then(function(resultId) {
        if(resultId.rowsChanged  != 1 ) {
            logger.error('Applicant Transaction was not Updated');
        }
        return resultId;
    });
};

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
    var updateQuery = undefined;

    //vercnt = number of verifications
    //actcnt = number of activities
    var hasChange = false;
    if ((req.body.vercnt || 0 ) > 0) {
      if(req.body.vercnt >  applicantTransaction.getVerifications()) {
          applicantTransaction.setVerifications(req.body.vercnt);
          hasChange = true;
      }
    }

    if ((req.body.actcnt || 0 )> 0) {
        if(req.body.actcnt >  applicantTransaction.getActivities()) {
            applicantTransaction.setActivities(req.body.actcnt);
            hasChange = true;
        }
    }
    if(hasChange) {
        updateApplicantTransaction(applicantTransaction);
    }

    req.applicantTransaction = applicantTransaction;

    next();

};
