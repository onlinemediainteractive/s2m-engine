var _ = require('lodash');
var S2mResponse = require("../common/s2mHttpResponse");
var logger = require('../helpers/log-helper');


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

    var questionSetId = req.body.questionSetId || undefined;
    if(!_.isNil(questionSetId)) {
      if(req.applicantTransaction.ssnTraceRequired()) {
          req.s2mResponse  = new S2mResponse('FAILED_INVALID_REQUEST', {"message" : 'Request contains Questions Answer Information, applicant has not passed SSN Verification' } );
      }
      else {
        if (!req.applicantTransaction.quizRequired()) {
            req.s2mResponse  = new S2mResponse('FAILED_INVALID_REQUEST', {"message" : 'Request contains Questions Answer Information, applicant has completed Identity Quiz' } );
        };
      };

    };
    logger.debug(scriptName + ' Continue ....');
    next();

};

