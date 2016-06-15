var _ = require('lodash');
var db = require("../helpers/mysql-helper");
var dateFormat = require("date-format");
var Promise = require('bluebird');
var using = Promise.using;
var S2mResponse = require("../common/s2mHttpResponse");
var logger = require('../helpers/log-helper');


//logResponse = function(req) {
function logResponse(req) {
    var scriptName    = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    logger.debug(scriptName + ' Starting ....');
    var query         = {};
    var params        = [];
    try {
        var requestLogId = req.requestLogId || undefined;
        if(_.isNil(requestLogId)) {
            return using(db.ping, function(){
                return undefined;
            });
        }
        else {
            //TODO add status code as a column
            var response = req.s2mResponse.getResponse();
            query     = 'update request_response_log ' +
                        'set response_body = ? ' +
                        ', end_time = ? ' +
                        ', http_status_code = ? ';
            params.push(JSON.stringify(response));
            params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', new Date()));
            params.push(req.s2mResponse.getHttpStatusCode());
            var appInfo = req.appInfo || undefined;
            if(!_.isNil(appInfo)) {
                if(!_.isNil(appInfo.id)) {
                    query =  query + ', application_id = ? ' ;
                    params.push(req.appInfo.id);
                };
            };

            if(!_.isNil(req.body.applicantRefId)) {
                query =  query + ', applicant_ref_id = ? ' ;
                params.push(req.body.applicantRefId);
            };


            query =  query + ' where id = ?' ;
            params.push(req.requestLogId );

            //logger.debug('query: ' + query);
            //logger.debug('params : ' + _.flatten(params));
            return using(db.update(query, params), function(result) {

                if(!_.isNil(result.error)) {
                    logger.error('Script: ' + scriptName + 'Could not log http response sql error');
                    logger.error('Error: ' + JSON.stringify(result.error));
                    logger.error('SQL Query: ' + query);
                    logger.error('SQL Params: ' + _.flatten(params));
                }
                logger.debug(scriptName + ' Ending .... ' + JSON.stringify(result.changedRows));
                return result.changedRows;
            });
        }
    } catch(err) {


        var msgObjs = {};
        msgObjs.internal = {"script" : scriptName,
            "err" : err};
        logger.debug(scriptName + ' Ending with Error.... Error : ' + JSON.stringify(err));
        throw (new S2mResponse("INTERNAL_ERR", msgObjs));
    }
};

module.exports = function(req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.main';
    logger.debug(scriptName + ' Starting ....');
    try {
        logger.debug(scriptName + ' Starting ....')
        if (!_.isNil(req.s2mResponse)) {

            var s2mResponse = req.s2mResponse;
            //TODO if not 200 then log an error

            logResponse(req).then(function (result) {
                if(s2mResponse.hasInternalMessage()) {
                    var internalMessage = s2mResponse.getInternalMessage();
                    db.logError(internalMessage.type, internalMessage.error, internalMessage.script, req).then(function(results) {
                        logger.debug(scriptName + ' Ending .... ' + s2mResponse.getMessage());
                        res.status(s2mResponse.getStatusCode()).send(s2mResponse.getResponse());
                    });
                }
                else {
                    logger.debug(scriptName + ' Ending .... ' + s2mResponse.getMessage());
                    res.status(s2mResponse.getStatusCode()).send(s2mResponse.getResponse());
                };
                
            });
        }
        else {
            logger.debug(scriptName + ' Continue ....');
            next();
        };
    }
    catch (err) {
        var s2mResponse = err;
        var isInstanceOf = (err instanceof S2mResponse);
        if( ! isInstanceOf) {
            var messege = s2mResponse.message || undefined;
            logger.debug('Unknown Error:' + JSON.stringify(err));
            s2mResponse = new S2mResponse("INTERNAL_ERR");
        };
        logger.debug(scriptName + ' Ending .... ' + s2mResponse.getMessage());
        res.status(s2mResponse.getStatusCode()).send(s2mResponse.getResponse());
    };
};
