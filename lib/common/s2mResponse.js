var S2mHttpResponse = require('./s2mHttpResponse');
var _ = require('lodash');


function S2mResponse(responseCode, message, questions) {

    this.objs = [];
    this.appInfo      = undefined;
    this.httpResponse = undefined;

    if(!_.isEmpty(responseCode)) {
     this.setHttpResponse(responseCode, message, questions);
    }
};


S2mResponse.prototype.addObject = function(key, value) {

    var indexOf = _.findIndex(this.objs, {'key' : key});

    if (indexOf > -1) {
        this.objs[indexOf].value = value;
    }
    else {
        this.objs.push({'key': key, 'value' : value})
    }


};


S2mResponse.prototype.getObject = function(key) {

    var result =  _.find(this.objs, {'key' : key});
    if(!_.isNil(result)) {
        return result.value;
    }

    return undefined;
    //return (_.find(this.objs, {'key' : key})).value;

    //if (indexOf > -1) {
    //    this.objs[indexOf].value = value;
    //}
    //else {
    //    this.objs.push({'key': key, 'value' : value})
    //}


}

S2mResponse.prototype.setScore = function(score) {
    this.httpResponse.setScore(score);
}

S2mResponse.prototype.setHttpResponse = function(responseCode, message, question) {

  
    this.httpResponse = new S2mHttpResponse(responseCode, message, question);

};

S2mResponse.prototype.getHttpResponse = function() {


   return this.httpResponse;

};

S2mResponse.prototype.setAppInfo = function(appInfo) {

    //this.appInfo = appInfo;
    this.addObject('appInfo',appInfo);

};

S2mResponse.prototype.getAppInfo = function() {

    return this.getObject('appInfo');

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


