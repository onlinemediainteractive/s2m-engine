var basicAuth = require('basic-auth');
var db = require("../helpers/mysql-helper");
var dateFormat = require('date-format');
var _ = require('lodash');
var logger = require('../helpers/log-helper');

module.exports = function(req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    var apiUser = basicAuth(req);

    req.apiUser = apiUser;


    var query = 'insert into request_reaponse_log ' +
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
    params.push(JSON.stringify(req.body));
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
