var basicAuth = require('basic-auth');
var db = require("../helpers/mysql-helper");
var dateFormat = require('date-format');
var _ = require('lodash');
var encrypt = require('../helpers/encrypt-helper');
var logger = require('../helpers/log-helper');

module.exports = function(req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');
    var bodyCopy = JSON.stringify(req.body) || '{}';
    bodyCopy = JSON.parse(bodyCopy);
    var apiUser = basicAuth(req);

    var remoteIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;


    req.apiUser = apiUser;

    //if(!_.isNil(bodyCopy.dob)) {
    //    bodyCopy.dob = encrypt.encryptDbString(bodyCopy.dob);
    //};
    //if(!_.isNil(bodyCopy.ssn)) {
    //    bodyCopy.ssn = encrypt.encryptDbString(bodyCopy.ssn);
    //};


    var query = 'insert into request_response_log ' +
                '(api_key, '    +
                'api_secret, '  +
                'start_time, '  +
                'request_body,' +
                'url,'          +
                'remote_ip, '   +
                'method) '      +
                'values(?, ?, ?, ?, ?, ?, ?)';
    var params = [];
    params.push(apiUser.name);
    params.push(apiUser.pass);
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', new Date()));
    params.push(JSON.stringify(bodyCopy));
    params.push(req.url);
    params.push(remoteIp);
    params.push(req.method);
    db.insertReturnId(query, params).then(function(resultId) {
      req.requestLogId = resultId || undefined;
      logger.debug(scriptName + ' Ending .... ID:' + resultId);
      if(_.isNil(req.error)) {
          next();
      }
      else {
          next(req.error);
      }

    });
};
