//var application = require('./application-express');

var middleware = require('../middleware/index');
//var _ = require('lodash');

/*exports.continueProcess= function(req, res, next) {
    if(!_.isNil(req.s2mResponse)) {
        var s2mResponse = req.s2mResponse;
        res.status(s2mResponse.getHttpStatusCode()).send(s2mResponse.getHttpResponse());
    }
    else {
        next();
    };
};

exports.requestHasApplicantRefId = function(req, res, next) {
    next();
};*/



module.exports.getApplication                 = middleware.apiGetApplication;
module.exports.getApplicant                   = middleware.apiGetApplicant;
module.exports.continueProcess                = middleware.apiContinueProcess;
module.exports.logRequest                     = middleware.apiLogRequest;
module.exports.createApplicant                = middleware.apiCreateApplicant;
module.exports.ssnTrace                       = middleware.apiSsnTrace;
module.exports.verifyIdentity                 = middleware.apiVerifyIdentity;
module.exports.nationalCriminalVerification   = middleware.apiNationalCriminalVerification;
module.exports.sexOffenderVerification        = middleware.apiSexOffenderVerification;
module.exports.getScore                       = middleware.apiGetScore;
module.exports.getScoreMock                   = middleware.apiGetScoreMock;


//module.exports.db            = middleware.dbMysql;
//module.exports.S2mResponse   = middleware.S2mResponse;

//module.exports.apiGetApplicant = middleware.apiGetApplicant;
