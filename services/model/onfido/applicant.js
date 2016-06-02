
var Promise = require('bluebird');
//var request = Promise.promisify(require("request"));
var _ = require('lodash');
//var validator = require('validator');
var config = require('config');
var onfidoConfig = config.get('Onfido.config');
var db = require("../../../lib/data_store/mysql");
//var db = require("../../../lib/data_store/applicantUtils");
//var S2mResponse = Promise.promisifyAll(require("../../../lib/common/s2mResponse"));
var S2mResponse = require("../../../lib/common/s2mResponse");
var dateFormat = require('date-format');
var bcrypt = require('bcrypt');
var rp = require('request-promise');
var s2mUtils = require("../../../lib/common/utils");

var lexisNexisConfig = config.get('LexisNexis.config');
var lexisnexisHelper = Promise.promisifyAll(require('../lexisnexis/lexisnexisHelper'));
var xml2js = Promise.promisifyAll(require('xml2js'));

module.exports = Applicant;


function Applicant(options) {

    //this.application = application;
    this.applicant = options.applicant || undefined;

    var now = new Date();
    this.applicant.emailAlias = now.getTime() + '.' + this.applicant.email;

    this.application = options.application || undefined;

    //this.validationErrors = [];
    //this.validate();
    this.response = undefined;

    this.processStatus = {};
    this.processStatus.id = undefined;
    this.processStatus.applicantCreation = undefined;
    this.processStatus.ssnVerification = undefined;
    this.processStatus.identityVerification = undefined;
    this.processStatus.nationalCriminalVerification = undefined;
    this.processStatus.sexOffenderVerification = undefined;
    this.processStatus.dirty = false;

};

Applicant.prototype.validate = function(){

    var validationErrors = [];

    var applicant = this.applicant;
    if(_.isEmpty(applicant.applicantRefId)){
        validationErrors.push('Applicant Reference Id cannot be blank ');
    };

    if(_.isEmpty(applicant.firstName)){
        validationErrors.push('First Name cannot be blank');
    };
    if(_.isEmpty(applicant.lastName)){
        validationErrors.push('Last Name cannot be blank and must contain at least 2 charaters');
    };
    if(_.isEmpty(applicant.email)){
        validationErrors.push('Email cannot be blank');
    };
    if(_.isEmpty(applicant.dob)){
        validationErrors.push('Date of Birth cannot be blank');
    };

    if(_.isEmpty(applicant.ssn)){
        validationErrors.push('SSN cannot be blank');
    };

    if(_.isEmpty(applicant.street)){
        validationErrors.push('Street Address cannot be blank');
    };

    if(_.isEmpty(applicant.town)){
        validationErrors.push('Town cannot be blank');
    };

    if(_.isEmpty(applicant.state)){
        validationErrors.push('State cannot be blank');
    };

    if(_.isEmpty(applicant.postalCode)){
        validationErrors.push('Postal Code cannot be blank');
    };

    if(validationErrors.length > 0) {
        this.response = new S2mResponse('FAILED_INTERNAL_VALIDATION','Invalid Request :' + _.flatten(validationErrors));
       // s2mResponse.setHttpResponse('REQUEST_FAILED_VALIDATION','Invalid Request :' + _.flatten(validationErrors));
    }
};


Applicant.prototype.hasResponse = function() {

    var booleanInd = false
    if(!_.isEmpty(this.response)) {
        booleanInd = true;
    }

    return booleanInd;
};

Applicant.prototype.getResponse = function() {

    return this.response;
};


Applicant.prototype.setResponse = function(response) {

    this.response = response;
};

Applicant.prototype.setResponse = function(response) {

    this.response = response;
};

Applicant.prototype.setProcessStatus = function(processStatus) {

    this.processStatus = processStatus;

    if(!_.isEmpty(processStatus)) {
        this.processStatus.dirty = true;
    }
};

Applicant.prototype.setApplicantCreation = function(applicantCreation) {

    this.processStatus.applicantCreation = applicantCreation;
    this.processStatus.dirty = true;
};

Applicant.prototype.setSsnVerification = function(ssnVerification) {

    this.processStatus.ssnVerification = ssnVerification;

    if(!_.isEmpty(this.processStatus.ssnVerification)) {
        if ((this.processStatus.ssnVerification.result == 'clear')  || (this.processStatus.ssnVerification.result == 'consider' && this.application.ssnTraceAcceptConsider)) {
            this.response = undefined;
        }
        else {
            this.response = new S2mResponse('FAILURE_SSN_TRACE');
        };
    };

};

Applicant.prototype.setApplicantCreation = function(applicantCreation) {

    this.processStatus.applicantCreation = applicantCreation;
    this.processStatus.dirty = true;
};

Applicant.prototype.setIdentityVerification = function(identityVerification) {

    this.processStatus.identityVerification = identityVerification;
    this.processStatus.dirty = true;

}

Applicant.prototype.setProcessStatusId = function(id) {

    this.processStatus.id = id;

}

Applicant.prototype.getApplicant = function() {

   
   // return db.getApplicant(this.application.id,this.applicant.applicantRefId).then(function (response) {
   //     var x = this;
   //     this.processStatus = response;
   //    return response;
   // });
    // var applicantStatus = {};
    var processStatus = {};
    var params = [this.application.id,
                  this.applicant.applicantRefId];
    var query = 'select * from applicant_transaction where application_id = ? and applicant_ref_id = ?  order by id LIMIT 1';
   // var x = this.processStatus;
    return db.query(query, params).then(function(results) {


       if(results.length == 1) {
           //this.processStatus = applicantStatus[0];
           var result = results[0]

           processStatus.id                           = result.id;
           processStatus.applicantCreation            = JSON.parse(result.applicant_creation);
           processStatus.ssnVerification              = JSON.parse(result.ssn_verification);
           processStatus.identityVerification         = JSON.parse(result.identity_verification);
           processStatus.nationalCriminalVerification = JSON.parse(result.national_criminal_verification);
           processStatus.sexOffenderVerification      = JSON.parse(result.sex_offender_verification);
           processStatus.dirty                        = false;
          // var d1 = applicantInfo[0].create_date;
          // var d2 = new Date();
          // var nbrDays = s2mUtils.daysBetween(applicantInfo[0].create_date,new Date());
          // if (nbrDays < applicationParams.expirationDays) {
          //     applicantStatus.createApplicant  = false;
               //applicantStatus.ssnTrace         = false;
          //     applicantStatus.ssnTraceResponse = JSON.parse(applicantInfo[0].response);
          // }

       }
      else {
           processStatus.id = undefined;
           processStatus.applicantCreation = undefined;
           processStatus.ssnVerification = undefined;
           processStatus.identityVerification = undefined;
           processStatus.nationalCriminalVerification = undefined;
           processStatus.sexOffenderVerification = undefined;

       }

       //return applicantStatus;
      return processStatus;

    });
};



Applicant.prototype.requiresSsnTrace = function() {
    var booleanInd = true;
    if(!_.isEmpty(this.processStatus.ssnVerification)) {
        if ((this.processStatus.ssnVerification.result == 'clear')  || (this.processStatus.ssnVerification.result == 'consider' && this.application.ssnTraceAcceptConsider)) {
            booleanInd = false;
        }
        else {
            this.processStatus.id = undefined;
            this.processStatus.applicantCreation = undefined;
            this.processStatus.ssnVerification = undefined;
            this.processStatus.identityVerification = undefined;
            this.processStatus.nationalCriminalVerification = undefined;
            this.processStatus.sexOffenderVerification = undefined;
            this.processStatus.dirty = false;
        };
    };

    return booleanInd;

};


Applicant.prototype.isAnswerRequest = function() {
    var booleanInd = false;
    if(!_.isEmpty(this.applicant.questionSetId)) {
        booleanInd = true
    }

    return booleanInd;

};

Applicant.prototype.requiresCriminalVerification = function() {

    /*var booleanInd = false;

    booleanInd = this.requiresNationalCriminalVerification();

    if(booleanInd) {
        return true;
    }

    booleanInd = this.requiresSexOffenderVerification ();

    return booleanInd;*/
    return false;
};

Applicant.prototype.scoreAvailable = function() {

    /*var booleanInd = false;

     booleanInd = this.requiresNationalCriminalVerification();

     if(booleanInd) {
     return true;
     }

     booleanInd = this.requiresSexOffenderVerification ();

     return booleanInd;*/
    return true;
};

Applicant.prototype.requiresNationalCriminalVerification = function() {

    var booleanInd = true;
    if(!_.isEmpty(this.processStatus.nationalCriminalVerification)) {
        booleanInd = false;
    }

    return booleanInd;
};

Applicant.prototype.sexOffenderVerification = function() {

    var booleanInd = true;
    if(!_.isEmpty(this.processStatus.nationalCriminalVerification)) {
        booleanInd = false
    }

    return booleanInd;
};

Applicant.prototype.requiresQuiz = function() {

    var booleanInd = true;
    if(!_.isEmpty(this.processStatus.identityVerification)) {
        if(this.processStatus.identityVerification.status == 'Passed') {
            booleanInd = false;
        }
    }
    return booleanInd;
};


/*Applicant.prototype.requires = function() {

    var booleanInd = true;
    if(!_.isEmpty(this.processStatus.identityVerification)) {
        if(this.processStatus.identityVerification.status == 'Passed') {
            booleanInd = false;
        }
    }
    return booleanInd;
}*/

Applicant.prototype.beginQuiz = function() {
    var auth = new Buffer(process.env.LEXIS_NEXIS_USER + ":" + process.env.LEXIS_NEXIS_PASSWORD).toString("base64");

    var soapUrl = lexisNexisConfig.url + lexisNexisConfig.wsdlPath;
    var options = {wsdl_headers: {Authorization:auth}};
    // var args = {name: 'value'};
    var applicant = this.applicant;

    var soapParams = {};

    //soapParams.accountName    = lexisNexisConfig.accountName;
    //soapParams.mode           = lexisNexisConfig.mode;
    //soapParams.ruleSet        = lexisNexisConfig.ruleSet;
    soapParams.firstName      = applicant.firstName;
    soapParams.lastName       = applicant.lastName;
    soapParams.dob            = applicant.dob;
    soapParams.ssn            = applicant.ssn;
    soapParams.street         = applicant.street;
    soapParams.city           = applicant.city
    soapParams.state          = applicant.state
    soapParams.postalCode     = applicant.postalCode;
    soapParams.addressContext = 'primary';
    soapParams.userIpAddress  = applicant.userIpAddress;


    var soapBody = lexisnexisHelper.parseVerificationBody(soapParams)
    console.log(soapBody);
    console.log(soapBody.length);

    var options = {};
    var fullUrl = lexisNexisConfig.url;

    options = {
        url : fullUrl,
        method : 'POST',
        headers : { 'Authorization': 'Basic ' + auth,  'Content-Type': 'text/xml', 'Content-Length': soapBody.length},
        body: soapBody,
        json: false
    };

    return  rp(options)
        .then(function (httpResponse) {
            return  lexisnexisHelper.response2jsonAsync(httpResponse)
                .then(function(jsonResponse) {
                    var questionResponse = {}
                    questionResponse.transactionId = jsonResponse.transactionId;
                    questionResponse.questionSetId = jsonResponse.questionSetId;
                    questionResponse.questions     = jsonResponse.questions;

                    var response = new S2mResponse('SUCCESS_RETURN_QUESTION',jsonResponse.message, questionResponse);
                    response.addObject("testResponse",jsonResponse.testResponse);
                    response.addObject("verificationStatus",jsonResponse.verificationStatus);
                    return response;
                })
                .catch(function (err) {
                    console.log(err)
                    var response = new S2mResponse('FAILURE_QUIZ', err.message);
                    response.addObject("verificationStatus",{"status": "error",
                                                             "reason" : err.message});
                    return response;
                });
        })
        .catch(function (err) {
            console.log(err)
            var response = new S2mResponse('REMOTE_ERR_LEXISNEXIS');
            response.addObject("verificationStatus",{"status": "error",
                                                     "reason" : err.message});
            return response;
        });
};


Applicant.prototype.continueQuiz = function() {
    var auth = new Buffer(process.env.LEXIS_NEXIS_USER + ":" + process.env.LEXIS_NEXIS_PASSWORD).toString("base64");

    var applicant = this.applicant;

    var soapParams = {};
    soapParams.transactionId = applicant.transactionId;
    soapParams.questionSetId = applicant.questionSetId;
    soapParams.answers       = applicant.answers;


    var soapBody = lexisnexisHelper.parseVerificationAnswerBody(soapParams)
    console.log(soapBody);
    var options = {};
    var fullUrl = lexisNexisConfig.url;

    options = {
        url : fullUrl,
        method : 'POST',
        headers : { 'Authorization': 'Basic ' + auth,  'Content-Type': 'text/xml', 'Content-Length': soapBody.length},
        body: soapBody,
        json: false
    };
    return  rp(options)
        .then(function (response) {
            return  lexisnexisHelper.response2jsonAsync(response)
                .then(function(jsonResponse) {
                    // could be a second set of questions
                    var response = new S2mResponse('SUCCESS_QUIZ',jsonResponse.message);
                    response.addObject("verificationStatus",jsonResponse.verificationStatus)
                    return response;
                })
                .catch(function (err) {
                    var response = new S2mResponse('FAILURE_QUIZ', err.message);
                    response.addObject("verificationStatus",{"status": "error",
                                       "reason" : err.message});
                    return response;
                });
        })
        .catch(function (err) {
            console.log("e err" + JSON.stringify(err));
            var response = new S2mResponse('REMOTE_ERR_LEXISNEXIS');
            response.addObject("verificationStatus",{"status": "error",
                "reason" : err.message});
            return response;
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
                        ssnVerification
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

Applicant.prototype.save = function() {

    var params   = [];
    var query    = undefined;

   // var id = this.processStatus.id;
    if (_.isNil(this.processStatus.id)) {
        //params.push(this.processStatus.id);
        params.push(this.application.id);
        params.push(this.applicant.applicantRefId);
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', new Date()));
        params.push(JSON.stringify(this.processStatus.applicantCreation));
        params.push(JSON.stringify(this.processStatus.ssnVerification));
        params.push(JSON.stringify(this.processStatus.identityVerification));
        params.push(JSON.stringify(this.processStatus.nationalCriminalVerification));
        params.push(JSON.stringify(this.processStatus.sexOffenderVerification));

        query = 'insert into applicant_transaction ' +
            '(application_id, ' +
            'applicant_ref_id, ' +
            'create_date, ' +
            'applicant_creation, ' +
            'ssn_verification, ' +
            'identity_verification, ' +
            'national_criminal_verification, ' +
            'sex_offender_verification) ' +
            'values(?, ?, ?, ?, ?, ?, ?, ?)';

    }
    else {
       // params.push(this.application.id);
       // params.push(this.applicant.applicantRefId);
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', new Date()));
        params.push(JSON.stringify(this.processStatus.applicantCreation));
        params.push(JSON.stringify(this.processStatus.ssnVerification));
        params.push(JSON.stringify(this.processStatus.identityVerification));
        params.push(JSON.stringify(this.processStatus.nationalCriminalVerification));
        params.push(JSON.stringify(this.processStatus.sexOffenderVerification));
        params.push(this.processStatus.id);


        query = 'update applicant_transaction ' +
            'set update_date = ? , ' +
            'applicant_creation = ?, ' +
            'ssn_verification = ?, ' +
            'identity_verification = ?, ' +
            'national_criminal_verification = ?, ' +
            'sex_offender_verification = ? ' +
            'where id = ? ';
    }

    return db.command(query, params).then(function(saveResult) {
        return saveResult;
    });
};


Applicant.prototype.createApplicant = function() {

    var applicant = this.applicant;

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
    };
    params.addresses.push(address);

    var options = {};
    var fullUrl = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.path;

    options = {
        url : fullUrl,
        method : 'POST',
        headers : { 'Authorization': 'Token token=' + onfidoConfig.apiKey, 'host': onfidoConfig.host, 'path': onfidoConfig.creatApplicantPath, },
        body: params,
        simple: true,
        json: true
    };
    console.log('create applicant params:' + JSON.stringify(params));
    return  rp(options)
            .then(function (httpResponse) {
                var response = {};
                response.httpResponse = httpResponse;
                response.s2mResponse  = undefined;

                console.log('success:' + JSON.stringify(httpResponse));

                response.httpResponse = httpResponse;
                response.s2mResponse  = undefined;

                return response;
            }).catch(function(httpResponse) {
                console.log('Error:' + httpResponse);
                var response = {};
                response.httpResponse = JSON.stringify(httpResponse);
                response.s2mResponse  = undefined;
                if (httpResponse.statusCode  > 499) {
                    response.s2mResponse = new S2mResponse('REMOTE_ERR');
                }
                else {

                    response.s2mResponse = new S2mResponse('FAILED_EXTERNAL_VALIDATION', httpResponse.error.error.message);
                };
                return response;
            });

};


Applicant.prototype.ssnTrace = function() {


    var params = {
        type : 'express',
        reports :[]
    };

    params.reports.push({name : 'ssn_trace'});


    var applicantId = this.processStatus.applicantCreation.id
    var options = {};
    var fullUrl = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.path + '/' + applicantId + onfidoConfig.checks;
    var path = '/v1/applicants/'+ applicantId +'/checks';

    options = {
        url : fullUrl,
        method : 'GET',
        headers : { 'Authorization': 'Token token=' + onfidoConfig.apiKey, 'host': onfidoConfig.host, 'path': path, },
        body: params,
        json: true
    };
    console.log('ssnTrace options:' + JSON.stringify(options));
    var responseMessage = undefined;
    return  rp(options)
        .then(function (httpResponse) {
            //console.log("e success" + JSON.stringify(response));

            return httpResponse;
        }).
        catch(function(httpResponse) {
            return httpResponse;
        })
};



Applicant.prototype.ssnCheck = function(reportType) {


    var params = {
        type : 'express',
        reports :[]
    };

   // params.reports.push({name : 'identity'});
    params.reports.push({name : reportType});
   // params.reports = reportType;

    var applicantId = this.processStatus.applicantCreation.id
    var options = {};
    var fullUrl = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.path + '/' + applicantId + onfidoConfig.checks;
    console.log(fullUrl);
    var path = '/v1/applicants/' +  applicantId +'/checks';

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
        .then(function (httpResponse) {
            //console.log("e success" + JSON.stringify(response));

            return httpResponse;
        }).
        catch(function(httpResponse) {
            return httpResponse;
        })
};


Applicant.prototype.calcScore = function() {
    var applicantCreation = this.processStatus.applicantCreation;
    var score = 0;
    if(!_.isNil(applicantCreation)) {
        var idNumbers = applicantCreation.id_numbers;
        var ssnObj = _.find(idNumbers,{'type' : 'ssn'});
        if (!_.isNil(ssnObj)) {
            var ssn = ssnObj.value;
            var key = ssn.substring(1,0);
            if (key == '1') {
                score = 300;
            }
            if (key == '2') {
                score = 740;
            }
            if (key == '3') {
                score = 790;
            }
            if (key == '4') {
                score = 800;
            }
            if (key == '5') {
                score = 825;
            }
            if (key == '6') {
                score = 850;
            }
            if (key == '7') {
                score = 400;
            }
            if (key == '8') {
                score = 450;
            }
            if (key == '9') {
                score = 500;
            }
            if (key == '0') {
                score = 200;
            }

        }
        else {
            score = 100;
        }


        var response = new S2mResponse('SUCCESS_SCORE');
        response.setScore(score);

        return response;
    }

}



