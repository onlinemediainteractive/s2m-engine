var Promise = require('bluebird');
var xml2js = Promise.promisifyAll(require('xml2js'));
var config = require('config');
var lexisNexisConfig = config.get('LexisNexis.config');
var _ = require('lodash');


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
    soapBody     = soapBody.replace('$accountName$', args.accountName);
    soapBody     = soapBody.replace('$mode$', args.mode);
    soapBody     = soapBody.replace('$ruleSet$', args.ruleSet);
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
        //console.log(JSON.stringify(value));
    });

    soapBody = soapBody + answerFragment +
        '</answers>' +
        '</m:transaction-continue>' +
        '</SOAP-ENV:Body>' +
        '</SOAP-ENV:Envelope>';

    return soapBody;
};


exports.response2json = function(xmlResponse, cb) {
    var responseBody = xmlResponse;
    var pos = responseBody.indexOf('<transaction-status>');
    responseBody = '<transaction-response>' + responseBody.substr(pos);
    responseBody = responseBody.replace('</java:transaction-response></env:Body></env:Envelope>','</transaction-response>');
    responseBody = responseBody.replace(/-/g,'_');
    console.log('responseBody :' + responseBody);
    return xml2js.parseStringAsync(responseBody).then(function(jsonResponse){
        var statusCode = jsonResponse.transaction_response.transaction_status[0].transaction_result[0];
        var error = jsonResponse.transaction_response.information[0].detail_description[0] + ' : ';

        if(statusCode == 'error') {
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
       return  cb(null,jsonResponse);
    });
};


exports.response2json = function(xmlResponse, cb) {
    var responseBody = xmlResponse;
    var pos = responseBody.indexOf('<transaction-status>');
    responseBody = '<transaction-response>' + responseBody.substr(pos);
    responseBody = responseBody.replace('</java:transaction-response></env:Body></env:Envelope>','</transaction-response>');
    responseBody = responseBody.replace(/-/g,'_');
    console.log('responseBody :' + responseBody);
    return xml2js.parseStringAsync(responseBody).then(function(jsonResponse){
        var statusCode = jsonResponse.transaction_response.transaction_status[0].transaction_result[0];
        var error = jsonResponse.transaction_response.information[0].detail_description[0] + ' : ';

        if(statusCode == 'error') {
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
        return  cb(null,jsonResponse);
    });
};

