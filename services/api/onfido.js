/**
 * Created by dfennell on 5/6/16.
 */
var request = require('request-promise');
var config = require('config');
var Applicant = require('../model/onfido/applicant_2');
var onfidoConfig = config.get('Onfido.config');
//var mySqlPool = require('../../lib/data_store/mysql');


var Onfido = function () {};



Onfido.createApplicant = function(applicantData) { 

    var applicant = new  Applicant(applicantData);

    var status = applicant.getStatus();
    console.log("status:" + JSON.stringify(status));

    //var url = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.creatApplicantPath;
    //console.log("URL:" + url);

    //options = {
    //    url : url,
    //    method : 'POST',
    //    headers : { 'Authorization': 'Token token=' + onfidoConfig.apiKey, 'host': onfidoConfig.host, 'path': onfidoConfig.creatApplicantPath, },
    //    body: applicantData,
    //    json: true
    //}

    request(options)
       .then(function (response) {
           //return callback(undefined, response);
           console.log("response:" + response);
           status = response;
       })
        .catch(function (err) {
            return callback(err, undefined)
        });

    return status;

};


module.exports = Onfido;