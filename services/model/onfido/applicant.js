
var Promise = require('bluebird');
//var request = Promise.promisify(require("request"));
var _ = require('lodash');
var validator = require('validator');
var config = require('config');
var onfidoConfig = config.get('Onfido.config');
var db = require("../../../lib/data_store/mysql");
var S2mResponse = Promise.promisifyAll(require("../../../lib/common/s2mResponse"));
var dateFormat = require('date-format');
var bcrypt = require('bcrypt');
var rp = require('request-promise');
var s2mUtils = require("../../../lib/common/utils");


validateApplicant = function(applicant){

    var errorList = [];

    if(_.isEmpty(applicant.applicantRefId)){
        errorList.push('Applicant Reference Id cannot be blank ');
    };

    if(_.isEmpty(applicant.firstName)){
        errorList.push('First Name cannot be blank');
    };
    if(_.isEmpty(applicant.lastName)){
        errorList.push('Last Name cannot be blank and must contain at least 2 charaters');
    };
    if(_.isEmpty(applicant.email)){
        errorList.push('Email cannot be blank');
    };
    if(_.isEmpty(applicant.dob)){
        errorList.push('Date of Birth cannot be blank');
    };

    if(_.isEmpty(applicant.ssn)){
        errorList.push('SSN cannot be blank');
    };

    if(_.isEmpty(applicant.street)){
        errorList.push('Street Address cannot be blank');
    };

    if(_.isEmpty(applicant.town)){
        errorList.push('Town cannot be blank');
    };

    if(_.isEmpty(applicant.state)){
        errorList.push('State cannot be blank');
    };

    if(_.isEmpty(applicant.postalCode)){
        errorList.push('Postal Code cannot be blank');
    };

    return errorList;

}

exports.validateRequestParams = function(applicant) {

    var errors = validateApplicant(applicant);
    var s2mResponse = new S2mResponse();
    if(errors.length > 0 ) {
        s2mResponse.setHttpResponse('REQUEST_FAILED_VALIDATION','Invalid Request :' + _.flatten(errors));
        return s2mResponse
    } else {
        return s2mResponse;
    }

};

getApplicantStatus = function(applicationParams, applicantRefId){

    var applicantStatus = {};
    var params = [applicationParams.id,
                  applicantRefId,
                  'Success'];
    var query = 'select * from applicant_json where application_id = ? and applicant_ref_id = ? and status = ? order by id LIMIT 1';
    return db.query(query, params).then(function(applicantInfo) {

       applicantStatus.createApplicant  = true;
       //applicantStatus.ssnTrace         = true;
       applicantStatus.ssnTraceResponse = undefined;

       if(applicantInfo.length == 1) {
          // var d1 = applicantInfo[0].create_date;
          // var d2 = new Date();
           var nbrDays = s2mUtils.daysBetween(applicantInfo[0].create_date,new Date());
           if (nbrDays < applicationParams.expirationDays) {
               applicantStatus.createApplicant  = false;
               //applicantStatus.ssnTrace         = false;
               applicantStatus.ssnTraceResponse = JSON.parse(applicantInfo[0].response);
           }

       }

       return applicantStatus;

    });
};


exports.processFlow = function(requestParams, applicationParams) {
    var s2mResponse = new S2mResponse();
    var applicantData = {};
    applicantData.applicationId   = applicationParams.id;
    applicantData.applicantRefId  = requestParams.applicantRefId;
    return getApplicantStatus(applicationParams, requestParams.applicantRefId).then(function(applicantStatus) {
        console.log(JSON.stringify(applicantStatus));
        if(applicantStatus.createApplicant) {
            return createApplicant(requestParams).then(function(createApplicantResponse) {
                console.log(JSON.stringify(createApplicantResponse));
                applicantData.thirdPartyId = createApplicantResponse.id;
                applicantData.thirdPartyHref = createApplicantResponse.href;
                if(createApplicantResponse.continue) {

                    return ssnTrace(createApplicantResponse.id).then(function(ssnTraceResponse) {
                        applicantData.thirdPartyResult = JSON.stringify(ssnTraceResponse.reports[0]);//ssnTraceResponse.;
                        applicantData.verificationHash = bcrypt.hashSync(JSON.stringify(requestParams),applicationParams.hashSaltRounds);
                        applicantData.status = 'Failure';
                        console.log(JSON.stringify(ssnTraceResponse));
                        if ((ssnTraceResponse.result == 'clear')  || (ssnTraceResponse.result == 'consider' && applicationParams.ssnTraceAcceptConsider)) {

                            s2mResponse.setHttpResponse('SUCCESS_CREATE', 'Applicant SSN Verification Complete');
                            console.log('Request Params:' + JSON.stringify(requestParams));
                            applicantData.response = JSON.stringify(s2mResponse);
                            applicantData.status = 'Success';
                        }
                        else
                        {
                            s2mResponse.setHttpResponse('FAILURE', 'Applicant SSN Could Not Be Verified');
                        };
                        return saveApplicant(applicantData).then(function(saveApplicantResponse){
                            return s2mResponse;
                        });
                    });
                }
                else {
                    s2mResponse.setHttpResponse(createApplicantResponse.error.errorCode, createApplicantResponse.error.message);
                    return s2mResponse;
                };
            });
        }
        else {
            s2mResponse.setHttpResponse('SUCCESS_APPLICANT_EXIST');
            return s2mResponse;
        }
    }).catch(function(error) {
        s2mResponse.setHttpResponse('INTERNAL_ERR');
        return s2mResponse;
    });
};

saveApplicant = function(applicantData) {

    var params = [applicantData.applicationId,
                  applicantData.applicantRefId,
                  dateFormat.asString('yyyy-MM-dd hh:mm:ss', new Date()),
                  applicantData.status,
                  applicantData.verificationHash,
                  applicantData.response,
                  applicantData.thirdPartyId,
                  applicantData.thirdPartyHref,
                  applicantData.thirdPartyResult];

    var query = 'insert into applicant_json ' +
        '(application_id, ' +
        'applicant_ref_id, ' +
        'create_date, ' +
        'status, '  +
        'verification_hash, ' +
        'response, ' +
        'third_party_id, ' +
        'third_party_href, ' +
        'third_party_result) ' +
        'values(?, ?, ?, ?, ?, ?, ?, ?, ?)';
    return db.command(query, params).then(function(saveResult) {
       return saveResult;
    });
};


createApplicant = function(applicant) {
    var params = {
        title              : applicant.title       || undefined,
        first_name         : applicant.firstName,
        middle_name        : applicant.middleName  || undefined,
        last_name          : applicant.lastName,
        email              : applicant.emailAlias,
        gender             : applicant.gender      || undefined,
        dob                : applicant.dob,
        telephone          : applicant.homePhone   || undefined,
        mobile             : applicant.mobilePhone || undefined,
        country            : applicant.country     || 'USA',
        id_numbers         : [],
        addresses          : [],
    };

    var ssnId = {
        type  : 'ssn',
        value : applicant.ssn
    };
    params.id_numbers.push(ssnId);

    var address = {
            flat_number     : applicant.flat_number      || undefined,
            building_number : applicant.building_number  || undefined,
            building_name   : applicant.building_name    || undefined,
            street          : applicant.street,
            sub_street      : applicant.sub_street       || undefined,
            town            : applicant.town,
            state           : applicant.state,
            postcode        : applicant.postalCode,
            country         : applicant.country          || 'USA'
    }
    params.addresses.push(address);

    var options = {};
    var fullUrl = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.path;

    options = {
        url : fullUrl,
        method : 'POST',
        headers : { 'Authorization': 'Token token=' + onfidoConfig.apiKey, 'host': onfidoConfig.host, 'path': onfidoConfig.creatApplicantPath, },
        body: params,
        json: true
    };
    console.log('create applicant params:' + JSON.stringify(params));
       return  rp(options)
            .then(function (response) {
                responseMsg         = {};
                responseMsg.error   = {};
                responseMsg.payload = {};
                responseMsg.body    = response.body;
                if(response.statusCode > 299) {
                    responseMsg.continue = false;
                    responseMsg.hasError = true;
                    if (response.statusCode  > 499) {
                        //responseMsg.error.message = 'Unable to Process Request';
                        responseMsg.error.errorCode   = 'REMOTE_ERR';
                    }
                    else {
                        responseMsg.error.message = JSON.stringify(response.body.error);
                        responseMsg.error.errorCode   = 'REQUEST_FAILED_VALIDATION';
                    }

                }
                else {
                    responseMsg.continue = true;
                    responseMsg.hasError = false;
                    responseMsg.id       = response.id;
                    responseMsg.href     = response.href;
                }
                return responseMsg;
            });
};


ssnTrace = function(applicantId) {
    var params = {
        type : 'express',
        reports :[]
    };

    params.reports.push({name : 'ssn_trace'});



    var options = {};
    var fullUrl = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.path + '/' + applicantId + onfidoConfig.checks;
    var path = '/v1/applicants/'+ applicantId+'/checks';

    options = {
        url : fullUrl,
        method : 'POST',
        headers : { 'Authorization': 'Token token=' + onfidoConfig.apiKey, 'host': onfidoConfig.host, 'path': path, },
        body: params,
        json: true
    };
    console.log('ssnTrace options:' + JSON.stringify(options));
    var responseMessage = undefined;
    return  rp(options)
        .then(function (response) {
            //console.log("e success" + JSON.stringify(response));
            return response;
        });
};


