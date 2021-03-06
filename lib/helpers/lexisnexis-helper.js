var Promise = require('bluebird');
var xml2js = Promise.promisifyAll(require('xml2js'));
var config = require('config');
var lexisNexisConfig = config.get('LexisNexis.config');
var _ = require('lodash');
var logger = require('../helpers/log-helper');

var utils = require('../common/utils');

utils.displayConfig('Lexis Nexis Configuration',lexisNexisConfig);


const identityVerification = '<?xml version="1.0" encoding="UTF-8"?>' +
'<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
'<SOAP-ENV:Body>' +
'<m:transaction-identity-verification xmlns:m="java:com.verid.carbon.integration.datatypes">' +
'<settings>' +
'<account-name>$accountName$</account-name>' +
'<mode>$mode$</mode>' +
'<ruleset>$ruleSet$</ruleset>' +
'<task>iauth</task>' +
//'<reference-id>$referenceId$</reference-id>' +
'</settings>' +
'<person>' +
'<name-first>$nameFirst$</name-first>' +
'<name-last>$nameLast$</name-last>' +
'<address>' +
'<address-street1>$addressStreet1$</address-street1>' +
'<address-city>$addressCity$</address-city>' +
'<address-state>$addressState$</address-state>' +
'<address-zip>$addressZip$</address-zip>' +
'<address-context>$addressContext$</address-context>' +
'</address>' +
'<birthdate>' +
'<year>$dobYear$</year>' +
'<month>$dobMonth$</month>' +
'<day>$dobDay$</day>' +
'</birthdate>' +
'<ssn>$ssn$</ssn>' +
'<ssn-type>ssn9</ssn-type>' +
//'<phone-number>' +
//'<phone-number>$phoneNumber$</phone-number>' +
//'<phone-number-context>$phoneNumberContext$</phone-number-context>' +
//'</phone-number>' +
'</person>' +
'<transaction>' +
'<account-verification>' +
//'<account-activity>' +
//'<account>' +
//'<customer-id>$customerId$</customer-id>' +
//'</account>' +
//'</account-activity>' +
'<activity-date>$activityDate$</activity-date>' +
'<venue>' +
'<online>' +
'<credential>' +
'<credential-method>$credentialMethod$</credential-method>' +
'<ip-address>$ipAddress$</ip-address>' +
'</credential>' +
'</online>' +
'</venue>' +
'</account-verification>' +
'</transaction>' +
'</m:transaction-identity-verification>' +
'</SOAP-ENV:Body>' +
'</SOAP-ENV:Envelope>';


const identityVerificationContinue = '<?xml version="1.0" encoding="UTF-8"?>' +
'<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
'<SOAP-ENV:Body>' +
'<m:transaction-continue xmlns:m="java:com.verid.carbon.integration.datatypes">' +
'<settings>' +
'<account-name>$accountName$</account-name>' +
'<mode>$mode$</mode>' +
'<ruleset>$ruleSet$</ruleset>' +
'<task>iauth</task>' +
'<transaction-id>$transactionId$</transaction-id>' +
'</settings>' +
'<answers>' +
'<question-set-id>$questionSetId$</question-set-id>';

exports.parseVerificationBody = function(args) {

    var now = new Date();
    var activityDate = now.toISOString();

    var soapBody = new String(identityVerification);
    soapBody     = soapBody.replace('$accountName$', lexisNexisConfig.accountName);
    soapBody     = soapBody.replace('$mode$', lexisNexisConfig.mode);
    soapBody     = soapBody.replace('$ruleSet$', lexisNexisConfig.ruleSet);
    soapBody     = soapBody.replace('$nameFirst$', args.firstName);
    soapBody     = soapBody.replace('$nameLast$', args.lastName);
    soapBody     = soapBody.replace('$ssn$', args.ssn);
    soapBody     = soapBody.replace('$dobYear$', args.dob.substr(0,4));
    soapBody     = soapBody.replace('$dobMonth$', args.dob.substr(5,2));
    soapBody     = soapBody.replace('$dobDay$', args.dob.substr(8,2));
    soapBody     = soapBody.replace('$addressStreet1$', args.street);
    soapBody     = soapBody.replace('$addressCity$', args.city);
    soapBody     = soapBody.replace('$addressState$', args.state);
    soapBody     = soapBody.replace('$addressZip$', args.postalCode);
    soapBody     = soapBody.replace('$addressContext$', args.addressContext);
    soapBody     = soapBody.replace('$activityDate$', activityDate);
    soapBody     = soapBody.replace('$credentialMethod$', 'basic');
    soapBody     = soapBody.replace('$ipAddress$', args.userIpAddress);

    return soapBody;
};


exports.parseVerificationAnswerBody = function(args) {
    var soapBody = new String(identityVerificationContinue);
    soapBody = soapBody.replace('$accountName$', lexisNexisConfig.accountName);
    soapBody = soapBody.replace('$mode$', lexisNexisConfig.mode);
    soapBody = soapBody.replace('$ruleSet$', lexisNexisConfig.ruleSet);
    soapBody = soapBody.replace('$transactionId$', args.transactionId);
    soapBody = soapBody.replace('$questionSetId$', args.questionSetId);
    var answerFragment = '';
    _.forIn(args.answers, function (value, key) {
        answerFragment = answerFragment +
            '<answer>' +
            '<question-id>' + value.questionId + '</question-id>' +
            '<choices>' +
            '<choice-id>' + value.choiceId + '</choice-id>' +
            '</choices>' +
            '</answer>';
    });

    soapBody = soapBody + answerFragment +
        '</answers>' +
        '</m:transaction-continue>' +
        '</SOAP-ENV:Body>' +
        '</SOAP-ENV:Envelope>';

    return soapBody;
};


exports.response2jsonCriminal = function(xmlResponse, cb) {
    var spaces = '-- ';
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');
    var responseBody = xmlResponse;
    var pos = responseBody.indexOf('<CrimSearchResponseEx>');
    responseBody =  responseBody.substr(pos);
    logger.debug("xml to json criminal" + responseBody);
    responseBody = responseBody.replace(/-/g, '_');
    logger.debug(spaces + 'parsing xml to json ');
    return xml2js.parseStringAsync(responseBody).then(function (jsonResponse) {
        logger.debug('jsonResponse :  ' + JSON.stringify(jsonResponse));
        criminalResponse = {};
        logger.debug('Header :  ' + JSON.stringify(jsonResponse.CrimSearchResponseEx.response[0].Header));
        criminalResponse.status = jsonResponse.CrimSearchResponseEx.response[0].Header[0].Status[0];
        criminalResponse.transactionId = jsonResponse.CrimSearchResponseEx.response[0].Header[0].TransactionId[0];
        criminalResponse.recordCount = parseInt(jsonResponse.CrimSearchResponseEx.response[0].RecordCount[0]);
        criminalResponse.responseBody = jsonResponse.CrimSearchResponseEx.response[0];
        if(criminalResponse.recordCount == 0)
            criminalResponse.verificationStatus = {"status": "success", "reason" : "Status 0, No Records found for SSN"};
        if(criminalResponse.recordCount > 0)
            criminalResponse.verificationStatus = {"status": "success", "reason" : "Status 0, " + criminalResponse.recordCount + " Records found for SSN"};
        return cb(null, criminalResponse);
    });
};

exports.response2jsonSexOffender = function(xmlResponse, cb) {
    var spaces = '-- ';
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');
    var responseBody = xmlResponse;
    var pos = responseBody.indexOf('<OffenderSearchResponseEx>');
    responseBody =  responseBody.substr(pos);
    logger.debug("xml to json criminal" + responseBody);
    responseBody = responseBody.replace(/-/g, '_');
    logger.debug(spaces + 'parsing xml to json ');
    return xml2js.parseStringAsync(responseBody).then(function (jsonResponse) {
        logger.debug('jsonResponse :  ' + JSON.stringify(jsonResponse));
        sexOffenderResponse = {};
        logger.debug('Header :  ' + JSON.stringify(jsonResponse.OffenderSearchResponseEx.response[0].Header));
        sexOffenderResponse.status = jsonResponse.OffenderSearchResponseEx.response[0].Header[0].Status[0];
        sexOffenderResponse.transactionId = jsonResponse.OffenderSearchResponseEx.response[0].Header[0].TransactionId[0];
        sexOffenderResponse.recordCount = parseInt(jsonResponse.OffenderSearchResponseEx.response[0].RecordCount[0]);
        sexOffenderResponse.responseBody = jsonResponse.OffenderSearchResponseEx.response[0];
        if(sexOffenderResponse.recordCount == 0)
            sexOffenderResponse.verificationStatus = {"status": "success", "reason" : "Status 0, No Records found for SSN"};
        if(sexOffenderResponse.recordCount > 0)
            sexOffenderResponse.verificationStatus = {"status": "success", "reason" : "Status 0, " + sexOffenderResponse.recordCount + " Records found for SSN"};
        return cb(null, sexOffenderResponse);
    });
};


exports.response2json = function(xmlResponse, cb) {
    var spaces = '-- ';
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');
    var responseBody = xmlResponse;
    var pos = responseBody.indexOf('<transaction-status>');
    responseBody = '<transaction-response>' + responseBody.substr(pos);
    responseBody = responseBody.replace('</java:transaction-response></env:Body></env:Envelope>','</transaction-response>');
    responseBody = responseBody.replace(/-/g,'_');
    logger.debug(spaces +  'parsing xml to json ');
    return xml2js.parseStringAsync(responseBody).then(function(jsonResponse){
        logger.debug('jsonResponse :  ' + JSON.stringify(jsonResponse));
        var statusCode = jsonResponse.transaction_response.transaction_status[0].transaction_result[0];
        var error = jsonResponse.transaction_response.information[0].detail_description[0] + ' : ';

        if(statusCode == 'error') {
            logger.debug(spaces +  'statusCode = error ');
            var nbrOfError = jsonResponse.transaction_response.information[0].simple_detail.length;
            var loopCnt = 1;
            _.forIn(jsonResponse.transaction_response.information[0].simple_detail, function (value, key) {

                error = error + value.text;
                if (loopCnt < nbrOfError) {
                    error = error + ', ';
                }
            });

            return cb( error, null);
        }
        else if (statusCode == 'failed') {
            logger.debug(spaces +  'statusCode = failed ');

            error = error + jsonResponse.transaction_response.information[0].detail_code[0];
            return cb(error, null);
        }
        else {
          if (jsonResponse.transaction_response.transaction_status[0].transaction_result[0] == 'questions') {
            logger.debug(spaces +  ' starting question building ... ');
            var questions = jsonResponse.transaction_response.questions[0].question;
            var identityTransaction = {};

            identityTransaction.transactionId = jsonResponse.transaction_response.transaction_status[0].transaction_id[0];
            identityTransaction.questionSetId = jsonResponse.transaction_response.questions[0].question_set_id[0];
            identityTransaction.create_dt = new Date();
            //identityTransaction.message = jsonResponse.transaction_response.information[0].simple_detail[0].text[0];
              identityTransaction.message = undefined;
              if(identityTransaction.message = jsonResponse.transaction_response.information[0].simple_detail == undefined) {
                  identityTransaction.message = jsonResponse.transaction_response.information[1].simple_detail[0].text[0];
              }
              else {
                  identityTransaction.message = jsonResponse.transaction_response.information[0].simple_detail[0].text[0];
              }


            identityTransaction.questions = [];

            var question = {};
            var choice = {};
            _.forIn(questions, function (value, key) {
                question = {}
                question.questionId = value.question_id[0];
                question.text = value.text[0].statement[0];
                question.choice = []
                _.forIn(value.choice, function (value, key) {
                    choice = {};
                    choice.choiceId = value.choice_id[0];
                    choice.text = value.text[0].statement[0];
                    question.choice.push(choice);
                });
                identityTransaction.questions.push(question);

            });
              logger.debug(spaces +  ' ending question building ... ');
            var testResponse = {};
            if (lexisNexisConfig.constructTestResponse == 'Yes') {
                logger.debug(spaces +  ' begining constructTestResponse ... ');

                testResponse.applicantRefId = '1';
                testResponse.transactionId = identityTransaction.transactionId
                testResponse.questionSetId = identityTransaction.questionSetId;
                testResponse.answers = [];
                var answer = {};
                var choiceLength = 0
                _.forIn(identityTransaction.questions, function (value, key) {
                    answer = {};
                    answer.questionId = value.questionId;
                    choiceLength = value.choice.length;
                    answer.choiceId = value.choice[choiceLength - 1].choiceId;
                    testResponse.answers.push(answer);
                });
                identityTransaction.testResponse = testResponse;
                identityTransaction.verificationStatus = {"status": "Continue",
                                                          "reason" : identityTransaction.message};
                logger.debug(spaces +  ' ending constructTestResponse ... ');
            }
            else {
                testResponse.applicantRefId = '1';
                testResponse.transactionId = 1;
                testResponse.questionSetId = 1;
                testResponse.answers = [];
            }
            identityTransaction.testResponse = testResponse;
            identityTransaction.verificationStatus = {"status": "Continue", "reason" : identityTransaction.message};
            logger.debug(scriptName + ' Returning ....');
            return cb(null, identityTransaction);
          }
          else
          {
              logger.debug(spaces +  ' non question response ');
              var identityTransaction = {};
              identityTransaction.transactionId = jsonResponse.transaction_response.transaction_status[0].transaction_id[0];
              identityTransaction.message       = jsonResponse.transaction_response.information[0].simple_detail[0].text[0];
              identityTransaction.questions     =  [];
              identityTransaction.verificationStatus = {"status": "success",
                  "reason" : identityTransaction.message};
              logger.debug(spaces + scriptName + ' Returning ....');
              return cb(null, identityTransaction);
          };

        }

    });
};



