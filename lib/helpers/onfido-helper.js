var _ = require('lodash');
var rp = require('request-promise');
var S2mResponse = require('../common/s2mHttpResponse');
var logger = require('./log-helper');
var config = require('config');
var utils = require('../common/utils');

var onfidoConfigSrv = 'Onfido.config';
if(!utils.isProduction()) {
  var useMockSerice = config.Onfido.mockInterface || 'inactive';
  if(useMockSerice == 'active') {
    onfidoConfigSrv = 'Onfido.mock';
    logger.info(' ');
    logger.info('****  Using Mock Onfido configuration  ****');
    logger.info(' ');
  };
};
var onfidoConfig = config.get(onfidoConfigSrv);

utils.displayConfig('Onfido Configuration',onfidoConfig);

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
        //value: requestParams.ssn
        value: req.ssn
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


    var options = {};
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
            options.body.id_numbers[0].value = '***-**-****';

            //logger.debug('Success :' + JSON.stringify(httpResponse));
            httpResponse.id_numbers[0].value =  '***-**-****';
            logger.debug('Success :' + JSON.stringify(httpResponse));

            if (_.isNil(httpResponse.href) || _.isNil(httpResponse.id)) {

              var s2mResponse = undefined;
              var httpResponseOptions = {};
              httpResponseOptions.message = 'Http response code 200, but href or id missing from response body';
              httpResponseOptions.internalMessage = {
                  "internal": "no",
                  "script": scriptName,
                  "processStep": "CREATE_APPLICANT",
                  "requestOptions": options,
                  "response": JSON.string(httpResponse),
                  "message" : "Http response code 200, but href or id missing from response body"
              };
              httpResponseOptions.errorCode = "ONFIDO_INVALID_RESPONSE";
              s2mResponse = new S2mResponse('APPLICANT_VALIDATION_FAILURE', httpResponseOptions);
            };

            return ({"httpResponse" : httpResponse, "s2mResponse" : s2mResponse});


        }).catch(function(httpResponse) {
            options.body.id_numbers[0].value = '***-**-****';
            logger.debug('Failure :' + JSON.stringify(httpResponse));
            logger.debug('Failure Response Code :' + httpResponse.statusCode);
            var s2mResponse = {};
            if (httpResponse.statusCode  > 499) {
                var httpResponseOptions = {};
                httpResponseOptions.internalMessage = {"internal" : "no",
                                           "script" : scriptName,
                                           "processStep" : "CREATE_APPLICANT",
                                           "requestOptions" : options,
                                           "response" : JSON.string(httpResponse),
                                           "message " : "External Service Error"};
                httpResponseOptions.errorCode = "REMOTE-SERVICE-ERROR";
                s2mResponse = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
            }
            else {
               options.body.id_numbers[0].value = '***-**-****';
               // logger.debug('Failure Response Code :' + httpResponse.statusCode);
                var fieldsErrors = httpResponse.error.error.fields;
                console.log(JSON.stringify(fieldsErrors));
                var errorMsg = '';
                var errorCnt = 0;
                _.forEach(fieldsErrors, function(value, key) {
                    if(errorCnt > 0) {
                        errorMsg = errorMsg + ', ';
                    }
                    errorMsg = errorMsg +  key + ' : ' + _.flatten(value);
                    errorCnt = errorCnt + 1;
                });
                //msgObjs.message = errorMsg;
                var httpResponseOptions = {};
                httpResponseOptions.message = 'Invalid Request, Validation Errors : ' + errorMsg;
                httpResponseOptions.internalMessage = {"internal" : "no",
                    "script" : scriptName,
                    "processStep" : "Create Applicationt",
                    "requestOptions" : options,
                    "response" : JSON.stringify((httpResponse)),
                    "message" : "Validation Errors : " + errorMsg}
                httpResponseOptions.errorCode = "APPLICANT_VALIDATION_REMOTE";
                s2mResponse = new S2mResponse('APPLICANT_VALIDATION_FAILURE', httpResponseOptions);
            };
            return ({"httpResponse" : httpResponse, "s2mResponse" : s2mResponse});
        });
    }
    catch(err) {
        logger.error(err.message);
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {"internal" : "yes",
            "script" : scriptName,
            "processStep" : "CREATE_APPLICANT",
            "requestOptions" : options,
            "response" : JSON.string(httpResponse),
            "message " : "External Service Error"};
        httpResponseOptions.errorCode = "INTERNAL_SERVICE_ERROR";
        var s2mResponse = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
        return ({"httpResponse" : null, "s2mResponse" : s2mResponse});
    };

};

function getReport(applicantId, reportName) {

    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    try {
        var params = {
            type: 'express',
            reports: []
        };
        if(reportName == 'national_criminal') {
            params.reports.push({name: reportName, 'variant': 'non_employment'});
        }
        else {
            params.reports.push({name: reportName});
        }

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
                logger.debug('Success - ' + reportName + ' : ' + JSON.stringify(httpResponse));
                return {"httpResponse": httpResponse};
            }).catch(function (httpResponse) {
                logger.debug('Failure - ' + reportName + ' : ' + JSON.stringify(httpResponse));
                //var s2mResponse = new S2mResponse('FAILED_INVALID_REQUEST');
                var httpResponseOptions = {};
                if(httpResponse.statusCode == 422) {
                    httpResponseOptions.internalMessage = {"internal" : "no",
                        "script" : scriptName,
                        "processStep" : reportName.toUpperCase(),
                        "requestOptions" : options,
                        "response" : JSON.stringify(httpResponse),
                        "message " : httpResponse.error.error.message || "External Service Error"};
                    httpResponseOptions.message = httpResponse.error.error.message || undefined;
                    httpResponseOptions.errorCode = "REMOTE-SERVICE-ERROR";
                    if(reportName == 'national_criminal') {
                        httpResponseOptions.errorCode = "FAILURE_NATIONAL_CRIMINAL";
                    }
                    if(reportName == 'sex_offender') {
                        httpResponseOptions.errorCode = "FAILURE_SEX_OFFENDER";
                    }

                    s2mResponse = new S2mResponse(httpResponseOptions.errorCode, httpResponseOptions);
                }
                else {
                    httpResponseOptions.internalMessage = {"internal" : "no",
                        "script" : scriptName,
                        "processStep" : reportName.toUpperCase(),
                        "requestOptions" : options,
                        "response" : JSON.stringify(httpResponse),
                        "message " : httpResponse.error.error.message || "External Service Error"};
                    httpResponseOptions.message = httpResponse.error.error.message || undefined;
                    httpResponseOptions.errorCode = "REMOTE-SERVICE-ERROR";
                    s2mResponse = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
                }

                return {"httpResponse": httpResponse, "s2mResponse": s2mResponse};
            });
    }
    catch(err) {
       logger.error(err.message);
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {"internal" : "yes",
            "script" : scriptName,
            "processStep" : reportName.toUpperCase(),
            "requestOptions" : options,
            "response" : JSON.string(httpResponse),
            "message " : "External Service Error"};
        httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
        var s2mResponse = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
        return ({"httpResponse" : null, "s2mResponse" : s2mResponse});
    };
};

module.exports = {
    createApplicant : createApplicant
   ,getReport : getReport
};