var _ = require('lodash');
var config = require('config');
var responseStatusCodes = config.get('responseStatusCodes.config');

const SUCCESS = 'Success';
const SUCCESS_CODE = '201';

function S2mHttpResponse(responseCode, message, questions) {

    var configRespone = _.find(responseStatusCodes,{"responseCode" : responseCode });
    this.response                 = {};
    //this.response.httpStatusCode  = configRespone.httpResponseCode;
    this.response.status          = configRespone.status ;
    this.response.type            = configRespone.type;
    this.response.responseCode    = configRespone.statusCode;
    this.response.message         = message || configRespone.message;
    if (configRespone.type == 'Questions') {
        this.response.questions = questions;
    }
    this.response.createdAt       = new Date();
    this.httpStatusCode           = configRespone.httpResponseCode;
    
    if(!_.isEmpty(configRespone.internalCode)) {
        this.response.message = this.response.message + ' ' +  configRespone.internalCode
    }

}

S2mHttpResponse.prototype.setQuestions = function(questions) {

    if (!_.isEmpty(this.response.questions))  {
        this.response.questions = questions;
    }

};


S2mHttpResponse.prototype.setScore = function(score) {

    if (!_.isNil(score))  {
        this.response.score = score;
    }

};

S2mHttpResponse.prototype.getHttpStatusCode = function() {

    return this.httpStatusCode;

};

S2mHttpResponse.prototype.getHttpResponse = function() {


    return this.response;

};


// export the class
module.exports = S2mHttpResponse;
