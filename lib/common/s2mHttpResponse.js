var _ = require('lodash');
var config = require('config');
var responseStatusCodes = config.get('responseStatusCodes.config');

const SUCCESS = 'Success';
const SUCCESS_CODE = '201';

function S2mHttpResponse(responseCode, options) {

    var opts = options || {};
    this.responseCode    = responseCode || undefined;
    this.status          = undefined;
    this.type            = undefined;

    this.message         = undefined;
    this.questions       = undefined;
    this.score           = undefined;
    this.createdAt       = new Date();
    this.internal        = undefined;
    this.processedSteps  = undefined;
    this.httpStatusCode  = undefined;
    this.errorCode       = undefined;
    this.reason          = undefined;
    this.internalMessage = undefined;

   // var responseCode = args.responseCode || undefined;
    if (_.isNil(this.responseCode)) {
        throw new Error('Http Response requires a response code');
    };
   // else {
    if (!_.isNil(opts.internalMessage)) {
        this.internal = opts.internalMessage.internal || 'yes';
    }
    else {
        this.internal = 'yes';
    };


    var configRespone = _.find(responseStatusCodes,{"responseCode" : this.responseCode});


    if (_.isNil(configRespone)) {
        throw new Error('Http Response responseCode[' + responseCode + '] not found in responseStatusCodes.config');
    }
    else {
        if (_.isNil(configRespone.httpResponseCode)) {
            throw new Error('Http Response responseCode[' + responseCode + '] does not have an HttpResponseCode');
        };
        this.status          = configRespone.status || 'Complete';
        this.type            = configRespone.type  || 'Message';
        this.message         = opts.message || configRespone.message;
        this.httpStatusCode  = configRespone.httpResponseCode || undefined;
        this.errorCode       = opts.errorCode || configRespone.errorCode || undefined;
    };


    if (this.type  == 'Questions') {
        if (_.isNil(opts.questions)) {
            throw new Error('Http Response responseCode[' + responseCode + '] is of type Questions but no Questions exist');
        };
        this.questions    = opts.questions || undefined;
    };

    if (this.type  == 'Score') {
        if (_.isNil(opts.score)) {
            throw new Error('Http Response responseCode[' + responseCode + '] is of type Score but no Score exist');
        };
        this.score    = opts.score || undefined;
    };


    //if (!_.isNil(opts.internal)) {
    //    this.internal = opts.internal;
    //} else {
    //    this.internal = 'Unknown';
    //};

    if (!_.isNil(opts.internalMessage)) {
        this.internalMessage = opts.internalMessage;
    };


};
S2mHttpResponse.prototype.getStatusCode = function() {

    return this.httpStatusCode;

};

S2mHttpResponse.prototype.setProcessedSteps = function(data) {

    this.processedSteps = data;

};

S2mHttpResponse.prototype.getHttpStatusCode = function() {

    return this.httpStatusCode;

};

S2mHttpResponse.prototype.getMessage = function() {

    return this.message;

};

S2mHttpResponse.prototype.setMessage = function(message) {

    this.message = message;

};

S2mHttpResponse.prototype.getInternalMessage = function() {

    return this.internalMessage;

};

S2mHttpResponse.prototype.hasInternalMessage = function() {

    var response = false;
    if(!_.isNil(this.internal)) {
        response = true;
    };

    return response;

};

S2mHttpResponse.prototype.setInternalMessage = function(message) {

    this.internalMessage = message;

};

S2mHttpResponse.prototype.getResponse = function() {
    var httpResponse = {};
    httpResponse.response = {};
    var response = httpResponse.response;

    response.status         = this.status;
    response.type           = this.type;
    response.message        = this.message;
    response.createdAt      = this.createdAt;
    response.httpStatusCode = this.httpStatusCode;

    if(!_.isNil(this.errorCode)) {
        response.errorCode =  this.errorCode;
    };

    if(!_.isNil(this.reason)) {
        response.reason =  this.reason;
    };

    if (this.type  == 'Questions') {

        response.questions = this.questions;
    };

    if (this.type  == 'Score') {

        response.score = this.score;
    };

    //if (!_.isNil(this.processedSteps)) {
    //
    //    response.processedSteps = this.processedSteps;
    //};

    return httpResponse;

};

S2mHttpResponse.prototype.hasQuestions = function() {

    var response = false;
    if (this.type  == 'Questions'){
        if(!_.isNil(this.questions)) {
            if(this.questions.length > 0) {
              response = true;
            };
        };
    };

    return response;

};


S2mHttpResponse.prototype.logAsError = function() {

    var response = true;

    if(this.httpStatusCode < 300) {
        response = false;
    } 
    return response;

};

// export the class
module.exports = S2mHttpResponse;
