var Promise = require('bluebird');
var db = require("./mysql");


getApplicant = function(applicationId, applicantRefId, applicant) {

    var params = [applicationId,
                  applicantRefId];
    var query = 'select * from applicant_transaction where application_id = ? and applicant_ref_id = ?  order by id LIMIT 1';
    var response = undefined;

    processStatus = {};
    processStatus.id = undefined;
    processStatus.applicantCreation = undefined;
    processStatus.ssnVerification = undefined;
    processStatus.identityVerification = undefined;
    processStatus.nationalCriminalVerification = undefined;
    processStatus.sexOffenderVerification = undefined;

    processStatus.dirty = false;

    return db.query(query, params).then(function(reults) {

        if (reults.length == 1) {
            //this.processStatus = applicantStatus[0];
            var result = reults[0]

            processStatus.id = result.id;
            processStatus.applicantCreation = result.applicant_creation;
            processStatus.ssnVerification = result.ssn_verification;
            processStatus.identityVerification = result.identity_verification;
            processStatus.nationalCriminalVerification = result.national_criminal_verification;
            processStatus.sexOffenderVerification = result.sex_offender_verification;
            processStatus.dirty = false;
        };

        return processStatus;
    });
};


module.exports.getApplicant = getApplicant;