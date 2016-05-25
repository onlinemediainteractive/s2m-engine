/**
 * Created by dfennell on 5/9/16.
 */
var _ = require('lodash');
//var client = require('./client');
//var Promise = require('bluebird');
var request = require('request-promise');
var config = require('config');
var onfidoConfig = config.get('Onfido.config');





var Applicant = function(params) {

    /**
     * Default params for an applicant
     * @type {Object}
     */
    var defaults = {
        transaction_ref_id : undefined,
        applicant_ref_id   : undefined,
        id                 : undefined,
        href               : undefined,
        title              : undefined,
        firstName          : undefined,
        middleName         : undefined,
        lastName           : undefined,
        email              : undefined,
        gender             : undefined,
        dob                : undefined,
        telephone          : undefined,
        mobile             : undefined,
        country            : 'USA',
        id_number          : [],
        address            : [],
        created_at         : new Date()
    };
    this.params = params;
    this.errors  = [];
    this.validationHasBeenRun = false;
   // this.options = {};

    // Assigning defaults to params, and params to self
    _.assign(this, _.defaults(this.params, defaults));

    //console.log(JSON.stringify(this.params));


    this.validate();


};



Applicant.prototype.validate = function() {

    console.log('Entering Applicant.prototype.validate');

    if(_.isNil(this.params.trasaction_ref_id)){
        this.errors.push("Transaction Reference Id required");
    }

    if(_.isNil(this.params.applicant_ref_id)){
        this.errors.push("Applicant Reference Id required");
    }
    
    this.validationHasBeenRun = true;

    console.log('Leaving Applicant.prototype.validate');
}

Applicant.prototype.getStatus = function() {
    console.log('Entering Applicant.prototype.getStatus');
    var status = {};
    if (!this.validationHasBeenRun) {
        this.validate();
    }

    if (_.isNil(this.errors)) {
        status = {"Status" : "OK"}
    }
    else
    {
        status = {"Status" : "FAIL", errors : this.errors};
    }
    return status;
    console.log('Leaving Applicant.prototype.getStatus');
};

Applicant.getErrors = function() {
    if (_.isNul(this.errors)) {
        return false;
    }
    else
    {
        return true;
    }
}


/*Applicant.prototype.getCreateOptions = function() {
    console.log('Entering Applicant.prototype.getCreateOptions');
    var options = {};
    var fullUrl = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.creatApplicantPath;

    options = {
        url : fullUrl,
        method : 'POST',
        headers : { 'Authorization': 'Token token=' + onfidoConfig.apiKey, 'host': onfidoConfig.host, 'path': onfidoConfig.creatApplicantPath, },
        body: this.params,
        json: true
    };
    return options;
    console.log('Leaving Applicant.prototype.getCreateOptions');
}*/

Applicant.prototype.createApplicant = function() {

    console.log('Entering Applicant.prototype.createApplicant');
    var options = {};
    var fullUrl = onfidoConfig.transport + onfidoConfig.host + onfidoConfig.creatApplicantPath;

    options = {
        url : fullUrl,
        method : 'POST',
        headers : { 'Authorization': 'Token token=' + onfidoConfig.apiKey, 'host': onfidoConfig.host, 'path': onfidoConfig.creatApplicantPath, },
        body: this.params,
        json: true
    };

    request(options)
        .then(function (response) {
            console.log("e success" + JSON.stringify(err));
            this.status = [];
            //res.status(200).send(response);
        })
        .catch(function (err) {
            console.log("e err" + JSON.stringify(err));
            // console.log("e messge" + JSON.stringify(err.name));
            // console.log("e messge" + JSON.stringify(err.statusCode));
            // console.log("e messge" + _.unescape(err.message));
            var eMessage = _.unescape(err.message);
            var n = eMessage.indexOf("{");
            //console.log("index of" + n);
            //console.log('json_str - ' + eMessage.substring( n));
            var mObject =  JSON.parse(eMessage.substring(n));
            console.log("mObject" + JSON.stringify(mObject));
            console.log("e type" + JSON.stringify(mObject.error.type));
            console.log("e messge" + JSON.stringify(mObject.error.message));
            // console.log("e messge" + err.message.message);
            res.status(442).send(err);
        })
    console.log('Lntering Applicant.prototype.createApplicant');
}

module.exports = Applicant;
