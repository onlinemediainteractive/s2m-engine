var S2mHttpResponse = require('./S2mHttpResponse');
var _ = require('lodash');


function S2mResponse() {

    this.appInfo      = undefined;
    this.httpResponse = undefined;
};



S2mResponse.prototype.setAppInfo = function(appInfo) {

    this.appInfo = appInfo;

};

S2mResponse.prototype.setHttpResponse = function(errorCode, message) {

  
    this.httpResponse = new S2mHttpResponse(errorCode, message);

};

S2mResponse.prototype.getHttpResponse = function() {


   return this.httpResponse;

};


S2mResponse.prototype.getAppInfo = function(appInfo) {

    return this.appInfo;

};


S2mResponse.prototype.continue = function() {


    if(_.isNil(this.httpResponse)) {
        return true;
    }
    else {
        return false;
    }

};

S2mResponse.prototype.getHttpStatusCode = function() {


    return this.httpResponse.httpStatusCode;

};


// export the class
module.exports = S2mResponse;


