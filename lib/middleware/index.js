module.exports = {
    apiGetApplication: require('./get-application')
   ,apiGetApplicant: require('./get-applicant-transaction')
   ,apiContinueProcess : require('./continue-process')
   ,apiLogRequest: require('./log-request')
   ,apiCreateApplicant : require('./create-applicant')
   ,apiSsnTrace : require('./ssn-trace')
   ,apiVerifyIdentity : require('./verify-identity')
   ,apiNationalCriminalVerification : require('./national-criminal-verification')
   ,apiSexOffenderVerification : require('./sex-offender-verification')
   ,apiCalcScore : require('./calc-score')
   ,apiGetScoreMock : require('./get-score-mock')
   ,apiApplicantState : require('./validate-applicant-state')
};