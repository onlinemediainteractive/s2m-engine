var Promise = require('bluebird');
//var request = Promise.promisify(require("request"));
var config = require('config');
var lexisNexisConfig = config.get('LexisNexis.config');
var helper = Promise.promisifyAll(require('./lexisnexisHelper'));
var xml2js = Promise.promisifyAll(require('xml2js'));
var db = require("../../../lib/data_store/mysql");
var _ = require('lodash');
var rp = require('request-promise');
//var parseString = require('xml2js').parseString;
//var using = Promise.using;

var auth = new Buffer(process.env.LEXIS_NEXIS_USER + ":" + process.env.LEXIS_NEXIS_PASSWORD).toString("base64");


exports.beginQuiz = function(params) {
    var soapUrl = lexisNexisConfig.url + lexisNexisConfig.wsdlPath;
    var options = {wsdl_headers: {Authorization:auth}};
   // var args = {name: 'value'};

    var soapParams = {};

    soapParams.accountName    = lexisNexisConfig.accountName;
    soapParams.mode           = lexisNexisConfig.mode;
    soapParams.ruleSet        = lexisNexisConfig.ruleSet;
    soapParams.firstName      = params.firstName;
    soapParams.lastName       = params.lastName;
    soapParams.dob            = params.dob;
    soapParams.ssn            = params.ssn;
    soapParams.street         = params.street;
    soapParams.city           = params.city
    soapParams.state          = params.state
    soapParams.postalCode     = params.postalCode;
    soapParams.addressContext = 'primary';
    soapParams.userIpAddress  = params.userIpAddress;


    var soapBody = helper.parseVerificationBody(soapParams)
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
        .then(function (response) {
            return  helper.response2jsonAsync(response)
                .then(function(jsonResponse) {
                    return jsonResponse;
                })
                .catch(function (err) {
                    console.log("e err" + JSON.stringify(err));
                    return err;
                });
        })
        .catch(function (err) {
            console.log("e err" + JSON.stringify(err));
            return err;
        });
    /*return  request(options)
        .then(function (response) {
            var responseBody = response.body;
            var pos = responseBody.indexOf('<transaction-status>');
            responseBody = '<transaction-response>' + responseBody.substr(pos);
            responseBody = responseBody.replace('</java:transaction-response></env:Body></env:Envelope>','</transaction-response>');
            responseBody = responseBody.replace(/-/g,'_');
            return xml2js.parseStringAsync(responseBody)
                .then(function (xml2jsResponse) {
                    
                    var questions = xml2jsResponse.transaction_response.questions[0].question;
                    var identityTransaction = {};

                    
                    identityTransaction.transactionId = xml2jsResponse.transaction_response.transaction_status[0].transaction_id[0];
                    identityTransaction.questionSetId = xml2jsResponse.transaction_response.questions[0].question_set_id[0];
                    identityTransaction.create_dt     = new Date();
                    identityTransaction.message       = xml2jsResponse.transaction_response.information[0].simple_detail[0].text[0];
                    identityTransaction.questions     = [];
                   
                    var question  = {};
                    var choice    = {};
                    _.forIn(questions, function(value, key) {
                        question = {}
                        //console.log(key + ' - ' + JSON.stringify(value));
                        question.questionId = value.question_id[0];
                        question.text        = value.text[0].statement[0];
                        question.choice      = []
                        _.forIn(value.choice, function(value, key) {
                            choice = {};
                            //console.log(key + ' - ' + JSON.stringify(value));
                            choice.choiceId = value.choice_id[0];
                            choice.text = value.text[0].statement[0];
                            question.choice.push(choice);
                        });
                        identityTransaction.questions.push(question);
                    });
                    identityTransaction.status = 'Success';
                    identityTransaction.status_code = 200;
                    if(lexisNexisConfig.constructTestResponse == 'Yes') {
                        var testResponse = {};
                        testResponse.questionSetId = identityTransaction.questionSetId;
                        testResponse.answers       = [];
                        var answer = {};
                        var choiceLength = 0
                        _.forIn(identityTransaction.questions, function(value, key) {
                            answer = {};
                            answer.questionId = value.questionId;
                            choiceLength = value.choice.length;
                            answer.choiceId = value.choice[choiceLength - 1].choiceId;
                            testResponse.answers.push(answer);
                            //console.log(key + ' - ' + JSON.stringify(value));
                            //console.log('choiceLength ' + choiceLength);
                        });
                        identityTransaction.testResponse = testResponse;
                    }
                    return(identityTransaction);
                });
        })
        .catch(function (err) {
            console.log("e err" + JSON.stringify(err));
            return err;
        });*/
};


exports.continueQuiz = function(params) {

    var soapBody = helper.parseVerificationAnswerBody(params)
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
           return  helper.response2jsonAsync(response)
              .then(function(jsonResponse) {
                  return jsonResponse;
              })
              .catch(function (err) {
                   console.log("e err" + JSON.stringify(err));
                   return err;
              });
        })
        .catch(function (err) {
          console.log("e err" + JSON.stringify(err));
          return err;
        });
};