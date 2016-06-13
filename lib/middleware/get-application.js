
var basicAuth = require('basic-auth');
var db = require("../helpers/mysql-helper");
var S2mResponse = require('../common/s2mHttpResponse');
var ApplicationInfo = require("../common/ApplicationInfo");
var logger = require('../helpers/log-helper');


module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');
 
    var apiUser = basicAuth(req);

    var query = 'select id, payload from application where api_key = ? and api_secret = ?';
    var params = [apiUser.name , apiUser.pass];
    db.querySingleRow(query,params).then(function(result) {

        var appInfo = new ApplicationInfo(result);
        if (appInfo.isActive() ) {
            req.appInfo = appInfo;
            logger.debug(scriptName + ' Continue ....')
            next();
        }
        else {
            req.s2mResponse  = new S2mResponse('FAILED_BASIC_AUTH_NO_USER_FOUND');
            logger.debug(scriptName + ' Continue ....')
            next();
        };
        
    });
};
