var _ = require('lodash');
var moment = require('moment');
var encrypt = require('../helpers/encrypt-helper');
var config = require('config');
var verifySteps = config.get('VerifySteps');
var utils = require('./utils');
utils.displayConfig('Verification Steps', verifySteps);

module.exports = ApplicantTransaction;
var dateFormat = require('date-format');

function ApplicantTransaction(options) {

    var opts = options || {};
    this.id                             = opts.id                              || undefined;
    this.applicationId                  = opts.application_id                  || undefined;
    this.applicantRefId                 = opts.applicant_ref_id                || undefined;

    var decryptedStr = undefined;
    //TODO need to add a try catch to the JSON.parse
    if(!_.isNil(opts.applicant_creation)) {
        this.applicantCreation              = JSON.parse(encrypt.decryptDbString(opts.applicant_creation));
    }
    else {
        this.applicantCreation              = undefined;
    };
    if(!_.isNil(opts.ssn_verification)) {
        this.ssnVerification                = JSON.parse(encrypt.decryptDbString(opts.ssn_verification));
        //this.ssnVerification                = JSON.parse(opts.ssn_verification);
    } else {
        this.ssnVerification                = undefined;
    };
    if(!_.isNil(opts.identity_verification)) {
        this.identityVerification                = JSON.parse(encrypt.decryptDbString(opts.identity_verification));
        //this.identityVerification                = JSON.parse(opts.identity_verification);
    } else {
        this.identityVerification                = undefined;
    };

    if(!_.isNil(opts.national_criminal_verification)) {
        //this.nationalCriminalVerification                = JSON.parse(opts.national_criminal_verification);
        this.nationalCriminalVerification                = JSON.parse(encrypt.decryptDbString(opts.national_criminal_verification));
    } else {
        this.nationalCriminalVerification                = undefined;
    };

    if(!_.isNil(opts.sex_offender_verification)) {
        //this.sexOffenderVerification                = JSON.parse(opts.sex_offender_verification);
        this.sexOffenderVerification                = JSON.parse(encrypt.decryptDbString(opts.sex_offender_verification));
    } else {
        this.sexOffenderVerification                = undefined;
    };


    //if(!_.isNil(opts.facebook_verification)) {
    //    //this.sexOffenderVerification                = JSON.parse(opts.facebook_verification);
    //    this.sexOffenderVerification                = JSON.parse(encrypt.decryptDbString(opts.facebook_verification));
    //} else {
    //    this.facebookVerification                = undefined;
    //};

    //if(!_.isNil(opts.social_media_data)) {
    //    //this.sexOffenderVerification                = JSON.parse(opts.facebook_verification);
    //    this.socialMediaData                = JSON.parse(encrypt.decryptDbString(opts.social_media_data));
    //} else {
    //    this.socialMediaData                = undefined;
    ///};

    this.ssnVerificationStatus              = opts.ssn_verification_status                 || undefined;
    this.applicantCreationStatus            = opts.applicant_creation_status               || undefined;
    this.identityVerificationStatus         = opts.identity_verification_status            || undefined;
    this.nationalCriminalVerificationStatus = opts.national_criminal_verification_status   || undefined;
    this.sexOffenderVerificationStatus      = opts.sex_offender_verification_status        || undefined;
   // this.facebookVerificationStatus         = opts.facebook_verification_status            || undefined;
    this.createDate                         = opts.create_date                             || undefined;
    this.updateDate                         = opts.update_date                             || undefined;
    //this.socialMediaVerification            = opts.social_media_verification               || undefined;
    //this.socialMediaVerificationStatus      = opts.social_media_status                     || undefined;


    this.identityVerificationAttempts     = opts.identity_verification_attempts          || 0;

    this.verifications                   = opts.verifications || 0;
    this.activities                      = opts.activities || 0;

};

ApplicantTransaction.prototype.clear = function() {

    this.id                                 = undefined;
    this.applicationId                      = undefined;
    this.applicantRefId                     = undefined;
    this.applicantCreation                  = undefined;
    this.ssnVerification                    = undefined;
    this.identityVerification               = undefined;
    this.nationalCriminalVerification       = undefined;
    this.sexOffenderVerification            = undefined;
    this.createDate                         = undefined;
    this.updateDate                         = undefined;
    this.ssnVerificationStatus              = undefined;
    this.identityVerificationStatus         = undefined;
    this.nationalCriminalVerificationStatus = undefined;
    this.sexOffenderVerificationStatus      = undefined;
    //this.facebookVerificationStatus         = undefined;
    this.applicantCreationStatus            = undefined;
    this.identityVerificationAttempts       = 0;
    //this.socialMediaData                    = undefined;
    //this.socialMediaVerificationStatus      = undefined;
    //this.socialMediaVerification            = undefined;

    this.verifications                      = 0;
    this.activities                         = 0;

};

ApplicantTransaction.prototype.setId = function(id) {

  this.id = id;
};

ApplicantTransaction.prototype.setApplicationId = function(applicationId) {

    this.applicationId = applicationId;
};

ApplicantTransaction.prototype.getApplicationId = function() {

    return this.applicationId;
};

ApplicantTransaction.prototype.setApplicantRefId = function(applicantRefId) {

    this.applicantRefId = applicantRefId;
};

ApplicantTransaction.prototype.getApplicantRefId = function() {

    return this.applicantRefId;
};


ApplicantTransaction.prototype.setApplicantCreation = function(applicantCreation) {

    this.applicantCreation = applicantCreation;
};

ApplicantTransaction.prototype.setApplicantCreationStatus = function(status) {

    this.applicantCreationStatus = status;
};


ApplicantTransaction.prototype.setNationalCriminalVerification = function(nationalCriminalVerification) {

    this.nationalCriminalVerification = nationalCriminalVerification;
};

ApplicantTransaction.prototype.getNationalCriminalVerification = function() {

    return this.nationalCriminalVerification;
};

ApplicantTransaction.prototype.setNationalCriminalVerificationStatus = function(status) {

    this.nationalCriminalVerificationStatus = status;
};

ApplicantTransaction.prototype.setSexOffenderVerification = function(sexOffenderVerification) {

    this.sexOffenderVerification = sexOffenderVerification;
};

ApplicantTransaction.prototype.getSexOffenderVerification = function() {

    return this.sexOffenderVerification;
};

ApplicantTransaction.prototype.setSexOffenderVerificationStatus = function(status) {

    this.sexOffenderVerificationStatus = status;
};


//ApplicantTransaction.prototype.setFacebookVerificationStatus = function(status) {

//    this.facebookVerificationStatus = status;
//};

//ApplicantTransaction.prototype.setFacebookVerification = function(facebookVerification) {

//    this.facebookVerification = facebookVerification;
//};


ApplicantTransaction.prototype.setSsnVerification = function(ssnVerification) {

    this.ssnVerification = ssnVerification;
};


//ApplicantTransaction.prototype.setSocialMediaData = function(socialMediaData) {

//    this.socialMediaData = socialMediaData;
//};

//ApplicantTransaction.prototype.getSocialMediaData = function() {
//
//    return this.socialMediaData;
//};

//ApplicantTransaction.prototype.setSocialMediaVerification = function(socialMediaVerification) {
//
//    this.socialMediaVerification = socialMediaVerification;
//};

//ApplicantTransaction.prototype.setSocialMediaVerificationStatus = function(socialMediaVerificationStatus) {

//    this.socialMediaVerificationStatus = socialMediaVerificationStatus;
//};

ApplicantTransaction.prototype.setSsnVerificationStatus = function(status) {
    this.ssnVerificationStatus = status;
}

ApplicantTransaction.prototype.setCreateDate = function(createDate) {

    this.createDate = createDate;
};


ApplicantTransaction.prototype.setUpdateDate = function(updateDate) {

    this.updateDate = updateDate;
};

ApplicantTransaction.prototype.setIdentityVerification = function(identityVerification) {

    this.identityVerification = identityVerification;
};


ApplicantTransaction.prototype.setIdentityVerificationStatus = function(status) {

    this.identityVerificationStatus = status;
};

ApplicantTransaction.prototype.getId = function() {

    return this.id;
};


ApplicantTransaction.prototype.getHrefId = function() {

    var hrefId = this.applicantCreation.params.id || undefined;

    return hrefId;
};


ApplicantTransaction.prototype.getSsn = function() {

    var ssn = this.applicantCreation.params.ssn || undefined;

    return ssn;
};



ApplicantTransaction.prototype.ssnTraceRequired = function() {

    var response = true;

    if(!_.isNil(this.ssnVerificationStatus)) {
      if(this.ssnVerificationStatus == 'success') {
        response = false;
      };
    };

    return response;
};


ApplicantTransaction.prototype.quizRequired = function() {

    var response = true;
    var stepActve = verifySteps.identityQuiz.status || 'active';
   
    if(stepActve !== 'active'){
        response = false;
    }
    else if(!_.isNil(this.identityVerificationStatus)) {
      if(this.identityVerificationStatus == 'success') {
        response = false;
      };
    };

    return response;
};

ApplicantTransaction.prototype.nationalCriminalVerificationRequired = function() {

    var response = true;

    if(!_.isNil(this.nationalCriminalVerificationStatus)) {
        if(this.nationalCriminalVerificationStatus == 'success') {
            response = false;
        };
    };
    return response;
};

ApplicantTransaction.prototype.sexOffenderVerificationRequired = function() {


    var response = true;

    if(!_.isNil(this.sexOffenderVerificationStatus)) {
        if(this.sexOffenderVerificationStatus == 'success') {
            response = false;
        };
    };
    return response;
};


ApplicantTransaction.prototype.sexOffenderVerificationRequired = function() {


    var response = true;

    if(!_.isNil(this.sexOffenderVerificationStatus)) {
        if(this.sexOffenderVerificationStatus == 'success') {
            response = false;
        };
    };
    return response;
};

ApplicantTransaction.prototype.getAge = function() {

    var age = undefined;
    var dobStr = this.applicantCreation.serviceResponse.dob || undefined;
    if(!_.isNil(dobStr)) {

        var now = moment();
        var dob = moment(this.applicantCreation.serviceResponse.dob);
        age = now.diff(dob, 'years', false);

    }

    return age;

};

ApplicantTransaction.prototype.getQuestionAttempts = function() {

    return this.identityVerificationAttempts;

};


ApplicantTransaction.prototype.setQuestionAttempts = function(attempts) {

    this.identityVerificationAttempts = attempts;

};


ApplicantTransaction.prototype.setVerifications = function(verifications) {
    this.verifications = verifications;
};

ApplicantTransaction.prototype.getVerifications = function() {
    return this.verifications;
};


ApplicantTransaction.prototype.setActivities = function(activities) {
    this.activities = activities;
};

ApplicantTransaction.prototype.getActivities = function() {
    return this.activities;
};




