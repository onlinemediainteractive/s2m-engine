var _ = require('lodash');
var Promise = require('bluebird');
var using = Promise.using;
//var mysql = require("../helpers/mysql");
var logger = require('../helpers/log-helper');
var encrypt = require('../helpers/encrypt-helper');
var dateFormat = require('date-format');
var db = require("../helpers/mysql-helper");

function insertSocialMediaData(applicationId, applicantRefId, source, attributes, status, accessToken, extendedToken, expireSeconds ) {
    var scriptName = __filename.split(/[\\/]/).pop();
    var now = new Date();
    var query = 'insert into social_media(application_id,applicant_ref_id,source, access_token, extended_token, status, attributes, create_date, update_date, expire_date) values(?,?,?,?,?,?,?,?,?,?)';
    var params = [];

    params.push(applicationId);
    params.push(applicantRefId);
    params.push(source);
    params.push(accessToken || null);
    params.push(extendedToken || null);
    params.push(status || 'active');
    params.push(JSON.stringify(attributes));
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
    if (!_.isNil(expireSeconds)) {
        now.setSeconds(now.getSeconds() + expireSeconds);
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
    } else {
        params.push(null);
    };
    return using(db.insertReturnId(query, params), function(result) {
        if(!_.isNil(result)) {
            return db.selectAnyById(result, 'social_media');
        } else {
            return result;
        };
    });

};

function getSocialMediaData(applicationId, applicantRefId, type ) {
    var scriptName = __filename.split(/[\\/]/).pop();
    var query = 'select * from social_media where application_id = ? and applicant_ref_id = ? and source = ?';
    var params = [applicationId , applicantRefId, type];
    return using(db.querySingleRow(query, params), function(result) {
        return result;
    });
};


function getSocialMediaAccounts(applicationId, applicantRefId) {
  var query = 'Select * from social_media where application_id = ? and applicant_ref_id = ? and status = ?';
  var params = [applicationId, applicantRefId, 'active'];
  return using(db.command(query, params), function(result) {
        return result;
  });
};



    module.exports = {
    getSocialMediaData    : getSocialMediaData,
    insertSocialMediaData : insertSocialMediaData,
    getSocialMediaAccounts : getSocialMediaAccounts
};