var rp = require('request-promise');
var S2mResponse = require('../common/s2mHttpResponse');
var config = require('config');
var onfidoConfig = config.get('Onfido.config');
var logger = require('./log-helper');
var _ = require('lodash');


//module.exports.createApplicant = function(req) {

function createApplicant(req) {
    var scriptName    = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    try {

    var requestParams = req.requestParams || {};

    var params = {
        title: requestParams.title || undefined,
        first_name: requestParams.firstName,
        middle_name: requestParams.middleName || undefined,
        last_name: requestParams.lastName,
        email:  requestParams.emailAlias,
        gender: requestParams.gender || undefined,
        dob: requestParams.dob,
        telephone: requestParams.homePhone || undefined,
        mobile: requestParams.mobilePhone || undefined,
        country: requestParams.country || 'USA',
        id_numbers: [],
        addresses: [],
    };

    var ssnId = {
        type: 'ssn',
        value: requestParams.ssn
    };
    params.id_numbers.push(ssnId);

    var address = {
        flat_number: requestParams.flat_number || undefined,
        building_number: requestParams.building_number || undefined,
        building_name: requestParams.building_name || undefined,
        street: requestParams.street,
        sub_street: requestParams.sub_street || undefined,
        town: requestParams.town,
        state: requestParams.state,
        postcode: requestParams.postalCode,
        country: requestParams.country || 'USA'
    };
    params.addresses.push(address);

    options = {};
    var fullUrl = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.path;

    options = {
        url : fullUrl,
        method : 'POST',
        headers : { 'Authorization': 'Token token=' + process.env.ONFIDO_APIKEY_ID, 'host': onfidoConfig.host, 'path': onfidoConfig.path, },
        body: params,
        simple: true,
        json: true
    };

    return  rp(options)
        .then(function (httpResponse) {
            var s2mResponse =  undefined;
            if (_.isNil(httpResponse.href) || _.isNil(httpResponse.id)) {
                var msgObjs = {};
                msgObjs.internal = {"script" : scriptName,
                    "error" : "Http response code 200, but href or id missing from response body",
                    "response" : httpResponse};
                s2mResponse = new S2mResponse('REMOTE_ERR', msgObjs);
            };

            return ({"httpResponse" : httpResponse, "s2mResponse" : s2mResponse});
        }).catch(function(httpResponse) {
            var s2mResponse = {};
            if (httpResponse.statusCode  > 499) {
                var msgObjs = {};
                msgObjs.internal = {"script" : scriptName}
                s2mResponse = new S2mResponse('REMOTE_ERR',msgObjs);
            }
            else {
                var msgObjs = {};
                msgObjs.internal = {"script" : scriptName,
                    "error" : "Falidation failed request service side. Validation Errors: " + httpResponse.error.error.message,
                    "type"  : "HTTP_REQUEST"};
                s2mResponse = new S2mResponse('FAILED_EXTERNAL_VALIDATION', msgObjs);
            };
            return ({"httpResponse" : httpResponse, "s2mResponse" : s2mResponse});
        });
    }
    catch(err) {
        logger.error(err.message);
        //TODO log error to db
        //TODO SET S2merror
    };

};

function getReport(applicantId, reportName) {

    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    try {


        var params = {
            type: 'express',
            reports: []
        };

        params.reports.push({name: reportName});

        //var applicantId = req.requestParams.id;
        var options = {};
        var fullUrl = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.path + '/' + applicantId + onfidoConfig.checks;
        var path = onfidoConfig.path + '/' + applicantId + onfidoConfig.checks;
        
        options = {
            url: fullUrl,
            method: 'POST',
            headers: {
                'Authorization': 'Token token=' + process.env.ONFIDO_APIKEY_ID,
                'host': onfidoConfig.host,
                'path': path,
            },
            body: params,
            json: true
        };
        return rp(options)
            .then(function (httpResponse) {
               // logger.debug(reportName + ' Response :' + JSON.stringify(httpResponse));
                return {"httpResponse": httpResponse};
            }).catch(function (httpResponse) {
                //TODO need to log error
               // logger.debug(reportName + ' Response :' + JSON.stringify(httpResponse));
                var s2mResponse = new S2mResponse('FAILED_INVALID_REQUEST');
                return {"httpResponse": httpResponse, "s2mResponse": s2mResponse};
            });
    }
    catch(err) {
       logger.error(err.message);
        //TODO log error to db
        //TODO SET S2merror
    };
};

module.exports = {
    createApplicant : createApplicant
   ,getReport : getReport
};