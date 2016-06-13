var _ = require('lodash');
var db = require("../helpers/mysql-helper");
var S2mResponse = require("../common/s2mHttpResponse");
var ApplicantTransaction = require("../common/ApplicantTransaction");
var logger = require('../helpers/log-helper');


function requestHasApplicantRefId(req) {
  var scriptName    = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];

  try {

      var applicantRefId = undefined;

      if(!_.isNil(req.body.applicantRefId)) {
          applicantRefId = req.body.applicantRefId;
      }
      else if (!_.isNil(req.params.applicantRefId)) {
          applicantRefId = req.params.applicantRefId;
      }

      if(!_.isNil())  {
          var msgObjs = {};
          msgObjs.message  = 'Applicant Reference Id cannot be blank ';
          msgObjs.internal = {"script" : scriptName};
          throw (new S2mResponse('FAILED_INVALID_REQUEST', msgObjs));
      }
      else {
          return applicantRefId;
      };

  } catch (err) {
      var msgObjs = {};
      msgObjs.internal = {"script" : scriptName,
                          "err" : err};
      throw (new S2mResponse("INTERNAL_ERR", msgObjs));
  };

};


parseApplicant = function(data) {
    
    
    if(_.isNil(data)) {
        return body.applicantRefId
    }
    else {
        throw ({code : 'FAILED_INVALID_REQUEST',
            message : 'Applicant Reference Id cannot be blank '});
    }
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

          req.applicantTransaction = new ApplicantTransaction(results);
          logger.debug(scriptName + ' Continue ....');
          next();
        });
    } catch (s2mResponse) {

        req.s2mResponse  = s2mResponse;
        logger.debug(scriptName + ' Continue ....');
        next();
    }

};



