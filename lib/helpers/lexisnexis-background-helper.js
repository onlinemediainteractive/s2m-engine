var Promise = require('bluebird');
var xml2js = Promise.promisifyAll(require('xml2js'));
var config = require('config');
var lexisNexisConfig = config.get('LexisNexis.config');
var _ = require('lodash');
var logger = require('../helpers/log-helper');

var utils = require('../common/utils');

utils.displayConfig('Lexis Nexis Configuration',lexisNexisConfig);


const backgroundVerification = '<?xml version="1.0" encoding="UTF-8"?>' +
'<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
'<SOAP-ENV:Body>' +
'<m:transaction-identity-verification xmlns:m="java:com.verid.carbon.integration.datatypes">' +

'<Envelope>' +
'<Body>' +
'<CrimSearchRequest>' +
'<User>' +

'<ReferenceCode>$$</ReferenceCode>' +
'<BillingCode>$$</BillingCode>' +
'<QueryId>$$</QueryId>' +
'<GLBPurpose>$$</GLBPurpose>' +
'<DLPurpose>$$</DLPurpose>' +
'<EndUser>' +
'<CompanyName>ABC Corporation</CompanyName>' +
'<StreetAddress1>123 NW Main Street</StreetAddress1>' +
'<City>Cocoplum</City>' +
'<State>FL</State>' +
'<Zip5>33442</Zip5>' +
'</EndUser>' +
'<MaxWaitSeconds>0</MaxWaitSeconds>' +
'<AccountNumber>S12345</AccountNumber>' +
'</User>' +
'<SearchBy>' +
'<SSN>123004567</SSN>' +
'<UniqueId>123456789</UniqueId>' +
'<DOCNumber>08966654</DOCNumber>' +
<!-- Use either unparsed format or parsed format to submit a name -->
<!-- You should not use both -->
<!-- If you submit both, only the unparsed form is considered -->
<!-- The parsed format is used in this example -->
'<Name>' +
'<First>JOHN</First>' +
'<Middle>HENRY</Middle>' +
'<Last>DOE</Last>' +
'<Suffix>JR</Suffix>' +
'</Name>' +
<!-- The unparsed format is used in this example -->
'<Name>' +
'<Full>JOHN HENRY DOE JR</Full>' +
'</Name>' +
<!-- Use either unparsed format or parsed format to submit an address -->
<!-- You can also use any combination that does not provide redundant input -->
<!-- The parsed format is used in this example -->
'<Address>' +
'<StreetNumber>2791</StreetNumber>' +
'<StreetPreDirection>NW</StreetPreDirection>' +
'<StreetName>BRONTE</StreetName>' +
'<StreetSuffix>WAY</StreetSuffix>' +
'<UnitDesignation>UNIT</UnitDesignation>' +
'<UnitNumber>B11</UnitNumber>' +
'<City>DEERFIELD BEACH</City>' +
'<State>FL</State>' +
'<Zip5>33442</Zip5>' +
'</Address>' +
<!-- The unparsed format is used in this example -->
'<Address>' +
'<StreetAddress1>4711 NW BRONTE WAY</StreetAddress1>' +
'<StreetAddress2>APT B11</StreetAddress2>' +
'<StateCityZip>DEERFIELD BEACH, FL 33442</StateCityZip>' +
'</Address>' +
'<DOB>' +
'<Year>1955</Year>' +
'<Month>07</Month>' +
'<Day>06</Day>' +
'</DOB>' +
'<FilingJurisdictionState>FL</FilingJurisdictionState>' +
'<CaseNumber>08966654</CaseNumber>' +
'</SearchBy>' +
'<Options>' +
'<UseNicknames>1</UseNicknames>' +
'<IncludeAlsoFound>1</IncludeAlsoFound>' +
'<UsePhonetics>1</UsePhonetics>' +
'<ReturnCount>10</ReturnCount>' +
'<StartingRecord>1</StartingRecord>' +
'</Options>' +
'</CrimSearchRequest>' +
'</Body>' +
'</Envelope>' +

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



