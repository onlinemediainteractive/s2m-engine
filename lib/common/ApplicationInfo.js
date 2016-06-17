var _ = require('lodash');

module.exports = ApplicationInfo;


function ApplicationInfo(options) {

    var opts = options || {};
    this.id                     = opts.id                        || undefined;

    var payloadObj = opts.payload || undefined;
    var payload = {};

    if(!_.isNil(payloadObj)) {
        payload = JSON.parse(payloadObj);
    };
    //var payload = opts.payload || {};
    this.name                   = payload.name                   || undefined;
    this.startDate              = payload.startDate              || undefined;
    this.expireDate             = payload.expireDate             || undefined;
    this.mode                   = payload.mode                   || undefined;
    this.ssnTraceAcceptConsider = payload.ssnTraceAcceptConsider || undefined;
    this.includeStepsPerformed  = payload.includeStepsPerformed  || false;


};

ApplicationInfo.prototype.getId = function() {

    return this.id;
};


ApplicationInfo.prototype.getIncludeStepsPerformed = function() {

    return this.includeStepsPerformed;
};


ApplicationInfo.prototype.isDevelopmentMode = function() {

    var response = false;
    if(!_.isNil(this.mode)) {
        if (this.mode = 'Development') {
            response = true;
        }
    }

    return response;
};


ApplicationInfo.prototype.isActive = function() {

    if(_.isNil(this.id)) {
        return false;
    }
    else {
        return true;
    }
};