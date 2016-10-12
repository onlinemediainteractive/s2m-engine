var middleware = require('../middleware/index');


module.exports.getApplication                 = middleware.apiGetApplication;
module.exports.getApplicant                   = middleware.apiGetApplicant;
module.exports.continueProcess                = middleware.apiContinueProcess;
module.exports.logRequest                     = middleware.apiLogRequest;
module.exports.createApplicant                = middleware.apiCreateApplicant;
module.exports.ssnTrace                       = middleware.apiSsnTrace;
module.exports.verifyIdentity                 = middleware.apiVerifyIdentity;
module.exports.nationalCriminalVerification   = middleware.apiNationalCriminalVerification;
module.exports.sexOffenderVerification        = middleware.apiSexOffenderVerification;
module.exports.calcScore                      = middleware.apiCalcScore;
module.exports.getScoreMock                   = middleware.apiGetScoreMock;
module.exports.applicantState                 = middleware.apiApplicantState;
module.exports.socialMediaVerification        = middleware.apiSocialMediaVerification;
module.exports.parseSocialMedia               = middleware.apiParseSocialMedia;
module.exports.facebookExtendToken            = middleware.apiFacebookExtendToken;
module.exports.updateApplicant                = middleware.apiUpdateApplicant;



