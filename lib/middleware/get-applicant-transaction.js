var _ = require('lodash');
var db = require("../helpers/mysql-helper");
var S2mResponse = require("../common/s2mHttpResponse");
var ApplicantTransaction = require("../common/ApplicantTransaction");
var logger = require('../helpers/log-helper');


function requestHasApplicantRefId(req) {
  var scriptName    = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
  logger.debug(scriptName + ' Starting ....');
  try {

      var applicantRefId = undefined;
      if(req.method == 'GET'){
          if (!_.isNil(req.params.applicantRefId)) {
              applicantRefId = req.params.applicantRefId;
          }
      }
      else {
          if (!_.isNil(req.body.applicantRefId)) {
              applicantRefId = req.body.applicantRefId;
          }
          else if (!_.isNil(req.params.applicantRefId)) {
              applicantRefId = req.params.applicantRefId;
          }
      };

      if(_.isNil(applicantRefId))  {
          var msgObjs = {};
          msgObjs.message  = 'Applicant Reference Id cannot be blank ';
          msgObjs.internal = {"script" : scriptName};
          logger.debug(scriptName + ' Ending .... Error : Applicant Reference Id cannot be blank');
          throw (new S2mResponse('FAILED_INVALID_REQUEST', msgObjs));
      }
      else {
          logger.debug(scriptName + ' Ending .... applicantRefId :' + applicantRefId);
          return applicantRefId;
      };

  } catch (err) {
      var httpResponseOptions = {};
      httpResponseOptions.message = 'Applicant Reference Id cannot be blank ';
      httpResponseOptions.internalMessage = {"internal" : "yes",
          "script" : scriptName,
          "processStep" : "CREATE_APPLICANT",
          "message" :  err.message};
      httpResponseOptions.errorCode = "APPLICANT_VALIDATION";
      var s2mResponse = new S2mResponse('APPLICANT_VALIDATION_FAILURE', httpResponseOptions);
      logger.debug(scriptName + ' Ending .... Error : Applicant Reference Id cannot be blank');
      throw (s2mResponse);
  };

};


module.exports = function(req, res, next) {
    var scriptName   = __filename.split(/[\\/]/).pop() + '.main';
    logger.debug(scriptName + ' Starting ....');
    try {
        var applicantRefId = requestHasApplicantRefId(req);
        var params = [req.appInfo.getId(),
                      applicantRefId];
        var query = 'select * from applicant_transaction where id = (select max(id) from applicant_transaction where application_id = ? and applicant_ref_id = ?)';

        db.querySingleRow(query, params).then(function(results) {

         // logger.error('applicant_transaction = '+ applicantRefId + ' results :' +
          req.applicantTransaction = new ApplicantTransaction(results);
          logger.debug("applicantTransaction : " + JSON.stringify(req.applicantTransaction));
          logger.debug(scriptName + ' Continue ....');
          next();
        });
    } catch (s2mResponse) {
        logger.error("error :"  + JSON.stringify(s2mResponse));
        req.s2mResponse  = s2mResponse;
        logger.debug(scriptName + ' Continue ....');
        next();
    }

};



