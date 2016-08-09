var _ = require('lodash');
var db = require("../helpers/mysql-helper");
var S2mResponse = require("../common/s2mHttpResponse");
var ApplicantTransaction = require("../common/ApplicantTransaction");
var logger = require('../helpers/log-helper');


function requestHasApplicantRefId(req) {
  var scriptName    = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];

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
          throw (new S2mResponse('FAILED_INVALID_REQUEST', msgObjs));
      }
      else {
          return applicantRefId;
      };

  } catch (err) {
      var httpResponseOptions = {};
      httpResponseOptions.message = 'Applicant Reference Id cannot be blank ';
      httpResponseOptions.internalMessage = {"internal" : "yes",
          "script" : scriptName,
          "processStep" : "CREATE_APPLICANT",
          "message" :  err.message}
      httpResponseOptions.errorCode = "APPLICANT_VALIDATION";
      var s2mResponse = new S2mResponse('APPLICANT_VALIDATION_FAILURE', httpResponseOptions);
      //throw ({code : 'FAILED_INVALID_REQUEST',
      //    message : 'Applicant Reference Id cannot be blank '});
      throw (s2mResponse);

      //var msgObjs = {};
      //msgObjs.internal = {"script" : scriptName,
      //                    "err" : err};
      //throw (new S2mResponse("INTERNAL_ERR", msgObjs));
  };

};


/*parseApplicant = function(data) {
    var scriptName    = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    
    if(_.isNil(data)) {
        return body.applicantRefId
    }
    else {
        var httpResponseOptions = {};
        httpResponseOptions.message = 'Applicant Reference Id cannot be blank ';
        httpResponseOptions.internalMessage = {"internal" : "yes",
            "script" : scriptName,
            "processStep" : "CREATE_APPLICANT",
            "message" :  "Validation Error : Applicant Reference Id cannot be blank"}
        httpResponseOptions.errorCode = "APPLICANT_VALIDATION";
        var s2mResponse = new S2mResponse('APPLICANT_VALIDATION_FAILURE', httpResponseOptions);
        //throw ({code : 'FAILED_INVALID_REQUEST',
        //    message : 'Applicant Reference Id cannot be blank '});
        throw (s2mResponse);
    };
};*/

module.exports = function(req, res, next) {
    var scriptName   = __filename.split(/[\\/]/).pop() + '.main';
    logger.debug(scriptName + ' Starting ....');
    try {
        var applicantRefId = requestHasApplicantRefId(req);
        var params = [req.appInfo.getId(),
                      applicantRefId];
        var query = 'select * from applicant_transaction where id = (select max(id) from applicant_transaction where application_id = ? and applicant_ref_id = ?)';

        db.querySingleRow(query, params).then(function(results) {

          req.applicantTransaction = new ApplicantTransaction(results);
          logger.debug(scriptName + ' Continue ....');
          next();
        });
    } catch (s2mResponse) {
        logger.error("error :"  + JSON.stringify(s2mResponse));
        //logger.error("error :"  + s2mResponse.getMessage());
        req.s2mResponse  = s2mResponse;
        logger.debug(scriptName + ' Continue ....');
        next();
    }

};



