var _ = require('lodash');
var db = require("../helpers/mysql-helper");
var S2mResponse = require("../common/s2mHttpResponse");
var logger = require('../helpers/log-helper');
var rp = require('request-promise');
var Promise = require('bluebird');
var using = Promise.using;
var dateFormat = require('date-format');

const socialMediaSource = 'facebook';

function getSocalMedia(applicatonId, applicantRefId) {
    var scriptName = __filename.split(/[\\/]/).pop();
    var query = 'select * from social_media where application_id = ? and applicant_ref_id = ? and source = ?';
    var params = [applicatonId , applicantRefId, 'facebook'];
    return using(db.querySingleRow(query, params), function(result) {
        return result;
    });
}


function updateSocalMedia(cmdType, applicatonId, applicantRefId, source, accessToken, extendedToken, status, attributes, expireSeconds) {
    var scriptName = __filename.split(/[\\/]/).pop();
    var query = undefined;
    var params = [];
    var now = new Date();
    if(cmdType = 'INSERT' ) {
        query = 'insert into social_media(application_id,applicant_ref_id,source, access_token, extended_token, status, attributes, created_date, update_date, expire_date) values(?,?,?,?,?,?,?,?,?,?)';
        params.push(applicatonId);
        params.push(applicantRefId);
        params.push(source);
        params.push(accessToken);
        params.push(extendedToken);
        params.push(status);
        params.push(attributes);
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
        now.setSeconds(now.getSeconds() + expireSeconds);
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));


    }
    else {

    }
    var query = 'select * from social_media where application_id = ? and applicant_ref_id = ? and source = ?';
    var params = [applicatonId , applicantRefId, 'facebook'];
    return using(db.querySingleRow(query, params), function(result) {
        return result;
    });
}


function getExtendedToken(accessToken) {
    var scriptName = __filename.split(/[\\/]/).pop();
    var options = {};
    var fullUrl = 'https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&' +
                  'client_id=' + process.env.FACEBOOK_APP_ID + '&' +
                  'client_secret=' + process.env.FACEBOOK_APP_SECRET + '&' +
                  'fb_exchange_token=' + accessToken;
    options = {
        url : fullUrl,
        method : 'GET',
        //headers : { 'Authorization': 'Token token=' + process.env.ONFIDO_APIKEY_ID, 'host': onfidoConfig.host, 'path': onfidoConfig.path, },
        //body: params,
        simple: true,
        json: true
    };

    return  rp(options)
        .then(function (httpResponse) {
            return {"httpResponse" : httpResponse, "s2mResponse" : undefined}
        }).catch(function (httpResponse) {
            logger.debug(httpResponse);
            var httpResponseOptions = {};
            httpResponseOptions.internalMessage = {"internal" : "no",
                "script" : scriptName,
                "processStep" : "SOCIAL_MEDIA_FACEBOOK",
                "message" :  httpResponse.message};
            httpResponseOptions.errorCode = "FAILED-SOCIAL-MEDIA-FACEBOOK";
            httpResponseOptions.message = httpResponse.error.error.message;
            var s2mResponse  = new S2mResponse('FAILURE_SOCIAL_MEDIA', httpResponseOptions);
            return {"httpResponse" : undefined, "s2mResponse" : s2mResponse}
        });

};



module.exports = function(req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.main';
    logger.debug(scriptName + ' Starting ....');


    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        //req.s2mResponse  = new S2mResponse('INTERNAL_ERR_NO_TRANSACTION');
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {"internal" : "yes",
            "script" : scriptName,
            "processStep" : "NATIONAL_CRIMINAL",
            "message" :  "No Appicant Transaction found in request object"};
        httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
        logger.debug(scriptName + ' Continue ....');
        next();

    };

    var socialMedia = req.socialMedia || [];
    if(socialMedia.length == 0) {
        logger.debug('No Socal Medial data found on request');
        logger.debug(scriptName + ' Continue ....');
        next();
    }
    else {
        var account = _.find(socialMedia, { 'source': 'facebook'});
        if(_.isNil(account)) {
            logger.debug('Facebook was not one of the social media accounts');
            logger.debug(scriptName + ' Continue ....');
            next();
        }
        else {
            getSocalMedia(req.appInfo.getId(), applicantTransaction.getApplicantRefId()).then(function(result) {
                var extendedToken = account.attributes.accessToken;
                var cmdType ='INSERT';
                if(!_.isNil(result)) {
                    cmdType = 'UPDATE';
                    if(!_.isNil(result.extended_token)) {
                        extendedToken = result.extended_token;
                    };
                };
                getExtendedToken(extendedToken).then(function(socialHttpResponse) {
                    if(!_.isNil(socialHttpResponse.s2mResponse)) {
                        req.s2mResponse = socialHttpResponse.s2mResponse;
                        logger.debug(scriptName + ' Continue ....');
                        next();
                    };
                    logger.debug(socialHttpResponse.httpResponse);
                    var socialHttpResponseJson = JSON.parse(socialHttpResponse.httpResponse);
                    updateSocalMedia(cmdType, req.appInfo.getId(), applicantTransaction.getApplicantRefId(),socialMediaSource, account.attributes.accessToken,socialHttpResponseJson.access_token,socialHttpResponseJson.expires)

                });

            });
            //getExtendedToken('a').then(function(httpResults) {
                //    logger.debug(httpResults);
                //    logger.debug(scriptName + ' Continue ....');
                //    next();
            //logger.debug(scriptName + ' Continue ....');
            //next();
        }
    }


    /*if(! _.isNil(req.body.socialMedia)) {
        var socialMedia = req.body.socialMedia;
        var facebook = socalMedia.facebook || undefined;
        if(! _.isNil(facebook)) {
            var accessToken = facebook.accessToken || undefined;
            if(! _.isNil(accessToken)) {

            }
            else {
                logger.debug(scriptName + ' Continue ....');
                next();
            }
        }
        else {
            logger.debug(scriptName + ' Continue ....');
            next();
        }
    }
    else {
        logger.debug(scriptName + ' Continue ....');
        next();
    }*/
    //getExtendedToken('a').then(function(httpResults) {
    //    logger.debug(httpResults);
    //    logger.debug(scriptName + ' Continue ....');
    //    next();
    //});
};
