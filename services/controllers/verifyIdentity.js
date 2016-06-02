var Promise = require('bluebird');
//var Applicant = Promise.promisifyAll(require('../model/onfido/applicant'));
var Applicant = require('../model/onfido/applicant');
Promise.promisifyAll(Applicant.prototype);

module.exports = VerifyIdentity;


function VerifyIdentity(application, applicant) {
    this.application = application;
    //this.applicant   = applicant;
    var options = {"application": application,
                   "applicant"  : applicant };
    this.Applicant   = new Applicant(options);
};



VerifyIdentity.prototype.process = function(callback) {
    console.log('VerifyIdentity.prototype.process');

    var applicant = this.Applicant;
  
    //Step 1 validate applicant
   // applicant.validate();
   // if(applicant.hasResponse()) {
   //    callback(null,applicant.getResponse());
   // }
    applicant.getApplicant().then(function(response) {
        console.log('getApplicant' + JSON.stringify(response));
        applicant.setProcessStatus(response);
        if(applicant.requiresSsnTrace()) {
            console.log('requires ssn trace');
            applicant.validate();
            if(applicant.hasResponse()) {
                callback(null,applicant.getResponse());
            };
            applicant.createApplicant().then(function (response) {
                console.log('create Applicant: ' + JSON.stringify(response));
                applicant.setApplicantCreation(response.httpResponse);
                applicant.setResponse(response.s2mResponse);
                if(applicant.hasResponse()) {
                    applicant.save().then(function(result) {
                        console.log('save result: ' + JSON.stringify(result));
                        callback(null,applicant.getResponse());
                    });
                }
                else {
                    //applicant.ssnTrace().then(function(response) {
                      applicant.ssnCheck('ssn_trace').then(function(response) {
                        console.log('ssntrace: ' + JSON.stringify(response));
                        applicant.setSsnVerification(response);
                        applicant.save().then(function (result) {
                            applicant.setProcessStatusId(result.insertId)
                            if(applicant.hasResponse()) {
                                callback(null,applicant.getResponse());
                            }
                            else {
                                applicant.beginQuiz().then(function(s2mResponse) {
                                    applicant.setResponse(s2mResponse);
                                    applicant.setIdentityVerification(s2mResponse.getObject('verificationStatus'));
                                    applicant.save().then(function (result) {
                                        //console.log('Quiz Questions 2: ' + JSON.stringify(s2mResponse));
                                        callback(null, applicant.getResponse());
                                    });
                                });
                            }
                        });
                    });
                };
           });

        }
        else if (applicant.requiresQuiz()) {
            if(!applicant.isAnswerRequest()) {
                applicant.beginQuiz().then(function(s2mResponse) {
                    applicant.setResponse(s2mResponse);
                    applicant.setIdentityVerification(s2mResponse.getObject('verificationStatus'));
                    applicant.save().then(function (result) {
                        //console.log('Quiz Questions 2: ' + JSON.stringify(s2mResponse));
                        callback(null, applicant.getResponse());
                    });
                });
            }
            else {
                applicant.continueQuiz().then(function(s2mResponse) {
                    var responseStatus = s2mResponse.getObject('verificationStatus');
                    applicant.setIdentityVerification(responseStatus);
                    applicant.save().then(function (result) {
                        //console.log('Quiz Questions 2: ' + JSON.stringify(s2mResponse));
                        if (response.status != 'Passed') {
                            callback(null, applicant.getResponse());
                        }
                        else {
                            if (applicant.requiresCriminalVerification()) {
                                applicant.ssnCheck('national_criminal').then(function(response){
                                    console.log(JSON.stringify(response));
                                    callback(null, response);
                                    callback(null, applicant.getResponse());
                                });


                            }
                            else {
                                if (applicant.scoreAvailable())  {
                                    var response = applicant.calcScore();
                                    callback(null, response);
                                }
                                
                            }
                        }

                    });

                });
            }

        }
        else if (applicant.requiresCriminalVerification()) {
            applicant.ssnCheck('sex_offender').then(function(response){
                console.log(JSON.stringify(response));
                callback(null, response);
                callback(null, applicant.getResponse());
            });


        }
        else if (applicant.scoreAvailable())  {
            var response = applicant.calcScore();
            callback(null, response);
        }
    });
}
