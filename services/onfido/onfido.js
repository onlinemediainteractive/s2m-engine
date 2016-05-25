/**
 * Created by dfennell on 5/4/16.
 */

var request = require('request-promise');
//var fs = require('fs');
var config = require('config');
var Applicant = require('applicant')
var onfidoConfig = config.get('Onfido.config');
var baseUrl = onfidoConfig.transport + onfidoConfig.host;

var Onfido = function () {};


//--------------------------------------
Onfido.createApplicant = function(applicantData) {
    
    var applicant = new  Applicant(applicantData);

    var url = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.creatApplicantPath;
    console.log("URL:" + url);
    
    options = {
        url : url,
        method : 'POST',
        headers : { 'Authorization': 'Token token=' + onfidoConfig.apiKey, 'host': onfidoConfig.host, 'path': onfidoConfig.creatApplicantPath, },
        body: applicantData,
        json: true
    }

//    request(options)
//        .then(function (response) {
//            return callback(undefined, response);
//        })
//        .catch(function (err) {
//            return callback(err, undefined);
//        })

};

Onfido.Applicant = function (opration,formdata, applicant_id, callback) {

    var options = {}


    if (opration == 'Create') {

        var url = 'https://api.onfido.com/v1/applicants';
        var path = '/v1/applicants';

        options = {
            url: url,
            method: 'POST',
            headers: { 'Authorization': 'Token token=' + API_KEY, 'host': 'api.onfido.com', 'path': path, },
            body: formdata,
            json: true
        }
    }
    else if (opration == 'Fetch') {
        var url = 'https://api.onfido.com/v1/applicants';
        var path = '/v1/applicants';


        options = {
            url: url,
            method: 'GET',
            headers: { 'Authorization': 'Token token=' + API_KEY, 'host': 'api.onfido.com', 'path': path, },
            body: formdata,
            json: true
        }
    }
    else if (opration == 'Fetchid') {
        var url = 'https://api.onfido.com/v1/applicants';
        var path = '/v1/applicants';

        if (applicant_id != '') {
            url = url + '/' + applicant_id;
            path = path + '/' + applicant_id;
        }

        options = {
            url: url,
            method: 'GET',
            headers: { 'Authorization': 'Token token=' + API_KEY, 'host': 'api.onfido.com', 'path': path, },
            body: formdata,
            json: true
        }
    }
    else {
        return callback('Error:Invalid opration', '', '');
    }



    request(options, function (error, response, body) {
        //console.log("errrrr: " + error);
        //console.log("statusCode: " + response.statusCode);
        if (!body.error) {
            // Print out the response body
            //console.log(body)
            //console.log("BODYertett: " + body);
            var result = {};
            result.response = response;
            result.body = body;
            result.error = error;

            return callback(error, response, body);
            //response.send(result);
            module.exports = result;
        }
        else {
            var result = {};
            result.error = body.error;
            return callback(error, response, body);
        }
    })

}

//Document Upload
//--------------------------------------
Onfido.Document = function (applicant_id,file_name,file_type,doc_type,file_location,callback) {

    var formData = {
        file_name: file_name,
        file_type: file_type,
        type: doc_type,
        file: fs.createReadStream(file_location)
    };

    var url = 'https://api.onfido.com/v1/applicants/' + applicant_id+'/documents';

    request.post({
        url: url,
        formData: formData,
        headers: { 'Authorization': 'Token token='+ API_KEY }
    }, function (err, httpResponse, body) {
        if (err) {
            return callback('Error:Upload Failed', '', '');
        }
        return callback(err, httpResponse, body);
    });

}

//Checks
//--------------------------------------
Onfido.Checks = function (opration, formdata, applicant_id,check_id, callback) {

    var options = {}


    if (opration == 'Create') {

        var url = 'https://api.onfido.com/v1/applicants/'+ applicant_id+'/checks';
        var path = '/v1/applicants/'+ applicant_id+'/checks';

        options = {
            url: url,
            method: 'POST',
            headers: { 'Authorization': 'Token token=' + API_KEY, 'host': 'api.onfido.com', 'path': path, },
            body: formdata,
            json: true
        }
    }
    else if (opration == 'Fetch') {
        var url = 'https://api.onfido.com/v1/applicants/' + applicant_id + '/checks';
        var path = '/v1/applicants/' + applicant_id + '/checks';


        options = {
            url: url,
            method: 'GET',
            headers: { 'Authorization': 'Token token=' + API_KEY, 'host': 'api.onfido.com', 'path': path, },
            body: formdata,
            json: true
        }
    }
    else if (opration == 'Fetchid') {
        var url = 'https://api.onfido.com/v1/applicants/' + applicant_id + '/checks';
        var path = '/v1/applicants/' + applicant_id + '/checks';

        if (check_id != '') {
            url = url + '/' + check_id;
            path = path + '/' + check_id;
        }

        options = {
            url: url,
            method: 'GET',
            headers: { 'Authorization': 'Token token=' + API_KEY, 'host': 'api.onfido.com', 'path': path, },
            body: formdata,
            json: true
        }
    }
    else {
        return callback('Error:Invalid opration', '', '');
    }



    request(options, function (error, response, body) {
        //console.log("errrrr: " + error);
        //console.log("statusCode: " + response.statusCode);
        if (!body.error) {
            // Print out the response body
            //console.log(body)
            //console.log("BODYertett: " + body);
            var result = {};
            result.response = response;
            result.body = body;
            result.error = error;

            return callback(error, response, body);
            //response.send(result);
            module.exports = result;
        }
        else {
            var result = {};
            result.error = body.error;
            return callback(error, response, body);
        }
    })

}

//Reports
//--------------------------------------
Onfido.Reports = function (opration, formdata, check_id,report_id, callback) {

    var options = {}


    if (opration == 'Fetch') {
        var url = 'https://api.onfido.com/v1/checks/' + check_id + '/reports';
        var path = '/v1/checks/' + check_id + '/reports';


        options = {
            url: url,
            method: 'GET',
            headers: { 'Authorization': 'Token token=' + API_KEY, 'host': 'api.onfido.com', 'path': path, },
            body: formdata,
            json: true
        }
    }
    else if (opration == 'Fetchid') {
        var url = 'https://api.onfido.com/v1/checks/' + check_id + '/reports';
        var path = '/v1/checks/' + check_id + '/reports';

        if (report_id != '') {
            url = url + '/' + report_id;
            path = path + '/' + report_id;
        }

        options = {
            url: url,
            method: 'GET',
            headers: { 'Authorization': 'Token token=' + API_KEY, 'host': 'api.onfido.com', 'path': path, },
            body: formdata,
            json: true
        }
    }
    else {
        return callback('Error:Invalid opration', '', '');
    }



    request(options, function (error, response, body) {
        //console.log("errrrr: " + error);
        //console.log("statusCode: " + response.statusCode);
        if (!body.error) {
            // Print out the response body
            //console.log(body)
            //console.log("BODYertett: " + body);
            var result = {};
            result.response = response;
            result.body = body;
            result.error = error;

            return callback(error, response, body);
            //response.send(result);
            module.exports = result;
        }
        else {
            var result = {};
            result.error = body.error;
            return callback(error, response, body);
        }
    })

}






module.exports = Onfido;


