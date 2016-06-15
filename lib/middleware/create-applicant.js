var _ = require('lodash');
var rp = require('request-promise');
var S2mResponse = require('../common/s2mHttpResponse');
var ApplicantTransaction = require("../common/ApplicantTransaction");
//var config = require('config');
//var onfidoConfig = config.get('Onfido.config');
//var securityConfig = config.get('Security.config');
var db = require("../helpers/mysql-helper");
var dateFormat = require('date-format');
var logger = require('../helpers/log-helper');
var onfido = require('../helpers/onfido-helper');
var encrypt = require('../helpers/encrypt-helper');

function validateRequestParams(params) {

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
    }
    else {
        if(params.dob.length !== 10) {
            validationErrors.push("Date of Birth format is 'YYYY-MM-DD' example: '2015-06-09'");
        };
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

function setRequestParams(req) {

    var requestParams = req.body || {};


    var now =  new Date();
    requestParams.emailAlias = now.getTime() + '.' + requestParams.email;
    req.requestParams = requestParams;

};




function insetApplicantTransaction(req, applicantCreationJson, status) {

    var query = 'insert into applicant_transaction ' +
        '(application_id, ' +
        'applicant_ref_id, ' +
        'create_date, ' +
        'applicant_creation,' +
        'applicant_creation_status) ' +
        'values(?, ?, ?, ?, ?)';
    var params = [];
    var now = new Date();
    params.push(req.appInfo.id);
    params.push(req.requestParams.applicantRefId);
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
    params.push(encrypt.encryptDbString(JSON.stringify(applicantCreationJson)));
    params.push(status);


    return db.insertReturnId(query, params).then(function(resultId) {
        if(!_.isNil(resultId)) {
            req.applicantTransaction.setApplicationId(req.appInfo.id);
            req.applicantTransaction.setApplicantRefId(req.requestParams.applicantRefId);
            req.applicantTransaction.setId(resultId);
            req.applicantTransaction.setApplicantCreation(applicantCreationJson);
            req.applicantTransaction.setApplicantCreationStatus(status);
            req.applicantTransaction.setCreateDate(now);
        }
        else {
            //TODO need to log error
            logger.error('Applicant Transaction was not Insert');
        }
        return resultId;
    });
};

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
            var responseStatus = 'failure';
            if (_.isNil(s2mResponse)) {
                req.requestParams.href = httpResponse.href;
                req.requestParams.id   = httpResponse.id;
                responseStatus = 'succss';
            }
            else {
                req.s2mResponse = s2mResponse;
            };
            applicantCreationJson.params = req.requestParams;
            insetApplicantTransaction(req, applicantCreationJson, responseStatus).then (function(results) {
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
