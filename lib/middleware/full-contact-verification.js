var db = require("../helpers/mysql-helper");
var S2mResponse = require('../common/s2mHttpResponse');
var ApplicationInfo = require("../common/ApplicationInfo");
var logger = require('../helpers/log-helper');
var config = require('config');
var fullContactConfig = config.get("FullContact");

function getDataByEmail(emailAddress) {

    var fullUrl =  fullContactConfig.transport + fullContactConfig.host + fullContactConfig.path + fullContactConfig.email +
                   'email=' + emailAddress;
    options = {
        url: fullUrl,
        method: 'GET',
        headers: {
            'Authorization':  'X-FullContact-APIKey: ' + process.env.FULLCONTACT_APIKEY_ID
           // 'host': fullContactConfig.host,
           // 'path': path,
        },
        //body: params,
        json: true
    };
    return rp(options)
        .then(function (httpResponse) {
            logger.debug('Success - ' + reportName + ' : ' + JSON.stringify(httpResponse));
            return {"httpResponse": httpResponse};
        }).catch(function (httpResponse) {
            logger.debug('Failure - ' + reportName + ' : ' + JSON.stringify(httpResponse));
            //var s2mResponse = new S2mResponse('FAILED_INVALID_REQUEST');
            var httpResponseOptions = {};
            httpResponseOptions.internalMessage = {"internal" : "no",
                "script" : scriptName,
                "processStep" : reportName.toUpperCase(),
                "requestOptions" : options,
                "response" : JSON.string(httpResponse),
                "message " : "External Service Error"};
            httpResponseOptions.errorCode = "REMOTE-SERVICE-ERROR";
            s2mResponse = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
            return {"httpResponse": httpResponse, "s2mResponse": s2mResponse};
        });

};

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');
    getDataByEmail('dan.fennell.jr@gmail.com').then(function(x) {
        y = x;
    });



};

