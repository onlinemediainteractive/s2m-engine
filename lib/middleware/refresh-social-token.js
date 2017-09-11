var basicAuth = require('basic-auth');
var db = require("../helpers/mysql-helper");
var logger = require('../helpers/log-helper');
var rp = require('request-promise');
var _ = require('lodash');
var Promise = require('bluebird');
var using = Promise.using;
var FB = require('fb');
var dateFormat = require('date-format');
var S2mResponse = require("../common/s2mHttpResponse");


function getRefreshToken(host, applicant_ref_id, extented_token ) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    logger.debug(scriptName + " Starting for " + applicant_ref_id + " ....");
    var options = {};
   // {"applicantRefId":200000,"actcnt":3,"vercnt":9,"socialMedia":{"facebook":{"userId":"2","accessToken":""},"linkedIn":"Y","twitter":"Y"}}
   // {"applicantRefId":1100000,"actcnt":1,"vercnt":1,"socialMedia":{"facebook":{"userId":"11","accessToken":"EAAOYpzfvZBT8BANdXEfZAiZAxMTp7CyPmKJKt8bC0XcmESvOXFGJ4bTvDUZBX0AB0LNZBrQQZAcFO2MVo8n3DHcudSo8jB4SNM6ZBgYurLhVd2f3TEn5CwWDwObrE8HurncpfQdsZA6trmUip3uFLFDoGb7UDUy8DkUZD"},"linkedIn":"Y","twitter":"Y"}}
    var postBody = {};
    //var socialMedia = {};
    postBody.applicantRefId      = applicant_ref_id;
    postBody.socialMedia         = {}
    postBody.socialMedia.facebook = {}
    postBody.socialMedia.facebook.userid = applicant_ref_id
    postBody.socialMedia.facebook.accessToken = extented_token
    var fullUrl = 'http://' + host + '/v1/extend/faceBookToken'
    var auth = new Buffer('6624847BQ6OTMTUEBYJY8ONQE:qsQ2FRrUzJHfrgYc57SbT9ViLPRrx8bpkiYYgC0WicU').toString("base64");
    options = {
        url : fullUrl,
        method : 'post',
        headers : { 'Authorization': 'Basic ' + auth,  'Content-Type': 'application/json', 'Content-Length': postBody.length},
        body: postBody,
        json: true
    };


    return  rp(options)
        .then(function (httpResponse) {
            logger.debug(scriptName + " Ending for " + applicant_ref_id + " ....");
            return {"httpResponse" : httpResponse, "s2mResponse" : undefined};
        }).catch(function (httpResponse) {
            logger.debug("httpResponse : " + httpResponse);
            return httpResponse;
        });

};


module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');
    var query = "SELECT * FROM s2mEng.social_media where status = 'active' and DATE_ADD(CURDATE(), INTERVAL ? DAY) >= expire_date and current_date < expire_date";
    var params = [parseInt(req.query.days)];
    var tasks = [];
    db.query(query,params).then(function(renewTokens) {
        if (!_.isNil(renewTokens)) {

                logger.debug(renewTokens.length + " Expiring Social media tokens to renew");
                for (var i = 0, len = renewTokens.length; i < len; i++) {
                    logger.debug(" host : "  + req.headers.host);
                    logger.debug(" renewToken : "  + JSON.stringify(renewTokens[i]));
                   tasks.push(getRefreshToken(req.headers.host, renewTokens[i].applicant_ref_id,renewTokens[i].extended_token ))

                }

            Promise.all(tasks).then(function() {
                logger.debug(scriptName + ' Ending ....');
                next();
            });

        }
        else {
            logger.debug('No Expiring Social media tokens ');
            logger.debug(scriptName + ' Ending ....');
            next();
        }
    });



}

