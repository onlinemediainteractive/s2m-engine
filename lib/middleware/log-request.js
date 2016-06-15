var basicAuth = require('basic-auth');
var db = require("../helpers/mysql-helper");
var dateFormat = require('date-format');
var _ = require('lodash');
var encrypt = require('../helpers/encrypt-helper');
var logger = require('../helpers/log-helper');

module.exports = function(req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');
    var params = JSON.stringify(req.body) || '{}';
    params = JSON.parse(params);
    var apiUser = basicAuth(req);

    req.apiUser = apiUser;

    if(!_.isNil(params.dob)) {
        params.dob = encrypt.encryptDbString(params.dob);
    };
    if(!_.isNil(params.ssn)) {
        params.ssn = encrypt.encryptDbString(params.ssn);
    };


    var query = 'insert into request_response_log ' +
                '(api_key, '    +
                'api_secret, '  +
                'start_time, '  +
                'request_body,' +
                'url,'          +
                'method) '      +
                'values(?, ?, ?, ?, ?, ?)';
    var params = [];
    params.push(apiUser.name);
    params.push(apiUser.pass);
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', new Date()));
    params.push(params);
    params.push(req.url);
    params.push(req.method);
    db.insertReturnId(query, params).then(function(resultId) {
      req.requestLogId = resultId || undefined;
      logger.debug(scriptName + ' Ending ....');
      if(_.isNil(req.error)) {
          next();
      }
      else {
          next(req.error);
      }

    });
};
