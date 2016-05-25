var _ = require('lodash');
var config = require('config');
var responseStatusCodes = config.get('responseStatusCodes.config');

const SUCCESS = 'Success';
const SUCCESS_CODE = '201';

function S2mHttpResponse(errorCode, message) {

    var configRespone = _.find(responseStatusCodes,{"errorCode" : errorCode });
    this.response                 = {};
    //this.response.httpStatusCode  = configRespone.httpResponseCode;
    this.response.status          = configRespone.status;
    this.response.statusCode      = configRespone.statusCode;
    this.response.message         = message || configRespone.message;
    this.response.createdAt       = new Date();
    this.httpStatusCode           = configRespone.httpResponseCode;

}

S2mHttpResponse.prototype.getHttpStatusCode = function() {

    return this.httpStatusCode;

};

S2mHttpResponse.prototype.getHttpResponse = function() {


    return this.response;

};


// export the class
module.exports = S2mHttpResponse;
