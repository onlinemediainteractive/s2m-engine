var _ = require('lodash');
var rp = require('request-promise');
var S2mResponse = require('../common/s2mHttpResponse');
var ApplicantTransaction = require("../common/ApplicantTransaction");
var config = require('config');
var onfidoConfig = config.get('Onfido.config');
var db = require("../helpers/mysql-helper");
var dateFormat = require('date-format');
var logger = require('../helpers/log-helper');
var onfido = require('../helpers/onfido-helper');

validateRequestParams = function(params) {

    var validationErrors = [];

    if(_.isNil(params.applicantRefId) || _.isEmpty(params.firstName)) {
        validationErrors.push('Applicant Reference Id cannot be blank ');
    };

    if(_.isNil(params.firstName) || _.isEmpty(params.firstName)){
        validationErrors.push('First Name cannot be blank');
    };

    if(_.isNil(params.lastName) || _.isEmpty(params.lastName)) {
        validationErrors.push('Last Name cannot be blank');
    }
    else if(params.lastName.length < 2) {
            validationErrors.push('Last Name must contain at least 2 charaters');
    };
    
    if(_.isNil(params.email) || _.isEmpty(params.email)) {
        validationErrors.push('Email cannot be blank');
    };
    //TODO add email validation

    if(_.isNil(params.dob) || _.isEmpty(params.dob)) {
        validationErrors.push('Date of Birth cannot be blank');
    };
    //TODO add dob validation

    if(_.isNil(params.ssn) || _.isEmpty(params.ssn)) {
        validationErrors.push('SSN cannot be blank');
    };
    //TODO add SSN validation

    if(_.isNil(params.street) || _.isEmpty(params.street)) {
        validationErrors.push('Street Address cannot be blank');
    };

    if(_.isNil(params.town) || _.isEmpty(params.town)) {
        validationErrors.push('Town cannot be blank');
    };

    if(_.isNil(params.state) || _.isEmpty(params.state)) {
        validationErrors.push('State cannot be blank');
    };
    //TODO add state validation

    if(_.isNil(params.postalCode) || _.isEmpty(params.postalCode)) {
        validationErrors.push('Postal Code cannot be blank');
    };
    //TODO add postal code validation

    if(_.isNil(params.userIpAddress) || _.isEmpty(params.userIpAddress)) {
        validationErrors.push('User IP address cannot be blank');
    };
    //TODO add user IP Address validation

    if(!_.isNil(params.country) || !_.isEmpty(params.country)) {
        if(country !== 'USA') {
          validationErrors.push('Only Country Code of USA allowed');
        }

    };

    if(!_.isEmpty(validationErrors)) {
        throw (new S2mResponse('FAILED_INTERNAL_VALIDATION', {message : 'Invalid Request :' + _.flatten(validationErrors)}));
    }
};

setRequestParams = function(req) {

    var requestParams = req.body || {};


    var now =  new Date();
    requestParams.emailAlias = now.getTime() + '.' + requestParams.email;
    req.requestParams = requestParams;

};

//postCreateApplicant = function(req) {
/*function postCreateApplicant(req) {
    var scriptName    = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
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
        headers : { 'Authorization': 'Token token=' + onfidoConfig.apiKey, 'host': onfidoConfig.host, 'path': onfidoConfig.path, },
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
};*/


saveCreateApplicant = function(req, applicantCreationJson) {

    var query = 'insert into applicant_transaction ' +
        '(application_id, ' +
        'applicant_ref_id, ' +
        'create_date, ' +
        'applicant_creation) ' +
        'values(?, ?, ?, ?)';
    var params = [];
    var now = new Date();
    params.push(req.appInfo.id);
    params.push(req.requestParams.applicantRefId);
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
    params.push(JSON.stringify(applicantCreationJson));


    return db.insertReturnId(query, params).then(function(resultId) {
        if(!_.isNil(resultId)) {
            req.applicantTransaction.setApplicationId(req.appInfo.id);
            req.applicantTransaction.setApplicantRefId(req.requestParams.applicantRefId);
            req.applicantTransaction.setId(resultId);
            req.applicantTransaction.setApplicantCreation(applicantCreationJson);
            req.applicantTransaction.setCreateDate(now);
        }
        else {
            //TODO need to log error
            logger.error('Applicant Transaction was not Insert');
        }
        return resultId;
    });
}

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.main';
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if(_.isNil(applicantTransaction)) {
        req.applicantTransaction = new ApplicantTransaction();
    };
    applicantTransaction = undefined;
    if(req.applicantTransaction.ssnTraceRequired()) {
        try {
            validateRequestParams(req.body);
        } catch (s2mResponse) {
            req.s2mResponse  = s2mResponse;
            logger.debug(scriptName + ' Continue ....');
            next();

        };
        req.applicantTransaction.clear();
        setRequestParams(req);
        //TODO create a factory for SSN Trace service
        onfido.createApplicant(req).then(function (response) {
            var s2mResponse = response.s2mResponse || undefined;
            var httpResponse = response.httpResponse || undefined;
            var applicantCreationJson = {};
            applicantCreationJson.serviceResponse = httpResponse;
            applicantCreationJson.responseStatus = 'failure';
            if (_.isNil(s2mResponse)) {
                req.requestParams.href = httpResponse.href;
                req.requestParams.id   = httpResponse.id;
                applicantCreationJson.responseStatus = 'succss';
            }
            else {
                req.s2mResponse = s2mResponse;
            };
            applicantCreationJson.params = req.requestParams;
            saveCreateApplicant(req, applicantCreationJson).then (function(results) {
              logger.debug(scriptName + ' Continue ....');
              next();
            });

        });
    }
    else {
        logger.debug(scriptName + ' Continue ....');
        next();
    };

};
