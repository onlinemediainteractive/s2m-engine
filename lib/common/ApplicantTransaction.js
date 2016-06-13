var _ = require('lodash');


module.exports = ApplicantTransaction;
var dateFormat = require('date-format');

function ApplicantTransaction(options) {

    var opts = options || {};
    this.id                             = opts.id                              || undefined;
    this.applicationId                  = opts.application_id                  || undefined;
    this.applicantRefId                 = opts.applicant_ref_id                || undefined;
    //TODO need to add a try catch to the JSON.parse
    if(!_.isNil(opts.applicant_creation)) {
        this.applicantCreation              = JSON.parse(opts.applicant_creation)
    }
    else {
        this.applicantCreation              = undefined;
    };
    if(!_.isNil(opts.ssn_verification)) {
        this.ssnVerification                = JSON.parse(opts.ssn_verification)
    } else {
        this.ssnVerification                = undefined;
    };
    if(!_.isNil(opts.identity_verification)) {
        this.identityVerification                = JSON.parse(opts.identity_verification)
    } else {
        this.identityVerification                = undefined;
    };

    if(!_.isNil(opts.national_criminal_verification)) {
        this.nationalCriminalVerification                = JSON.parse(opts.national_criminal_verification)
    } else {
        this.nationalCriminalVerification                = undefined;
    };

    if(!_.isNil(opts.sex_offender_verification)) {
        this.sexOffenderVerification                = JSON.parse(opts.sex_offender_verification)
    } else {
        this.sexOffenderVerification                = undefined;
    };


    this.createDate                     = opts.create_date                     || undefined;
    this.updateDate                     = opts.update_date                     || undefined;

   // this.applicantParams                = {};

};

ApplicantTransaction.prototype.clear = function() {

    this.id                             = undefined;
    this.applicationId                  = undefined;
    this.applicantRefId                 = undefined;
    this.applicantCreation              = undefined;
    this.ssnVerification                = undefined;
    this.identityVerification           = undefined;
    this.nationalCriminalVerification   = undefined;
    this.sexOffenderVerification        = undefined;
    this.createDate                     = undefined;
    this.updateDate                     = undefined;

};

ApplicantTransaction.prototype.setId = function(id) {

  this.id = id;
};

ApplicantTransaction.prototype.setApplicationId = function(applicationId) {

    this.applicationId = applicationId;
};

ApplicantTransaction.prototype.setApplicantRefId = function(applicantRefId) {

    this.applicantRefId = applicantRefId;
};


ApplicantTransaction.prototype.setApplicantCreation = function(applicantCreation) {

    this.applicantCreation = applicantCreation;
};


ApplicantTransaction.prototype.setNationalCriminalVerification = function(nationalCriminalVerification) {

    this.nationalCriminalVerification = nationalCriminalVerification;
};

ApplicantTransaction.prototype.setSexOffenderVerification = function(sexOffenderVerification) {

    this.sexOffenderVerification = sexOffenderVerification;
};



ApplicantTransaction.prototype.setSsnVerification = function(ssnVerification) {

    this.ssnVerification = ssnVerification;
};

ApplicantTransaction.prototype.setCreateDate = function(createDate) {

    this.createDate = createDate;
};


ApplicantTransaction.prototype.setUpdateDate = function(updateDate) {

    this.updateDate = updateDate;
};

ApplicantTransaction.prototype.setIdentityVerification = function(identityVerification) {

    this.identityVerification = identityVerification;
};

ApplicantTransaction.prototype.getId = function() {

    return this.id;
};


ApplicantTransaction.prototype.getHrefId = function() {

    var hrefId = this.applicantCreation.params.id || undefined;

    return hrefId;
};


ApplicantTransaction.prototype.getSsn = function() {

    var ssn = this.applicantCreation.params.ssn|| undefined;

    return ssn;
};



ApplicantTransaction.prototype.ssnTraceRequired = function() {

    var response = true;

    if(!_.isNil(this.ssnVerification)) {
        var responseStatus = this.ssnVerification.responseStatus || undefined;
        if(!_.isNil(responseStatus)) {
            if(responseStatus = 'success') {
                response = false;
            };
        };
    };

    return response;
};


ApplicantTransaction.prototype.requiresQuiz = function() {

    var response = true;
    if(!_.isNil(this.identityVerification)) {
        var responseStatus = this.identityVerification.status || undefined;
        if(!_.isNil(responseStatus)) {
            if(responseStatus == 'Passed') {
                response = false;
            };
        };
    };
    return response;
};



ApplicantTransaction.prototype.requiresNationalCriminalVerification = function() {

    var response = true;

    if(!_.isNil(this.nationalCriminalVerification)) {
        var responseStatus = this.nationalCriminalVerification.status || undefined;
        if(!_.isNil(responseStatus)) {
            if(responseStatus == 'success') {
                response = false;
            };
        };
    };
    return response;
};



ApplicantTransaction.prototype.requiresSexOffenderVerification = function() {


    var response = true;

    if(!_.isNil(this.sexOffenderVerification)) {
        var responseStatus = this.sexOffenderVerification.status || undefined;
        if(!_.isNil(responseStatus)) {
            if(responseStatus = 'success') {
                response = false;
            };
        };
    };
    return response;
};



