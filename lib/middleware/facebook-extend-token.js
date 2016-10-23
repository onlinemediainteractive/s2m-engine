var _ = require('lodash');
var db = require("../helpers/mysql-helper");
var S2mResponse = require("../common/s2mHttpResponse");
var logger = require('../helpers/log-helper');
var rp = require('request-promise');
var Promise = require('bluebird');
var using = Promise.using;
var dateFormat = require('date-format');

var FB = require('fb');

const socialMediaSource = 'facebook';

function getSocalMedia(applicatonId, applicantRefId) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    logger.debug(scriptName + ' Starting ....');
    var query = 'select * from social_media where application_id = ? and applicant_ref_id = ? and source = ?';
    var params = [applicatonId , applicantRefId, 'facebook'];
    return using(db.querySingleRow(query, params), function(result) {
        logger.debug(scriptName + ' Ending .... ');
        return result;
    });
}






function updateSocalMedia(cmdType, applicatonId, applicantRefId, source, accessToken, extendedToken, expireSeconds, status, attributes, profileData, id) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    logger.debug(scriptName + ' Starting ....');
    var query = undefined;
    var params = [];
    var now = new Date();
    if(cmdType === 'INSERT' ) {
        query = 'insert into social_media(application_id,applicant_ref_id,source, access_token, extended_token, status, attributes, create_date, update_date, expire_date, profile_data) ' +
                 'values(?,?,?,?,?,?,?,?,?,?,?)';
        params.push(applicatonId);
        params.push(applicantRefId);
        params.push(source);
        params.push(accessToken);
        params.push(extendedToken);
        params.push(status);
        params.push(attributes);
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
        var extDate = new Date(now.getTime() + (expireSeconds * 1000));
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', extDate));
        params.push(JSON.stringify(profileData));
        return db.insertReturnId(query, params).then(function(resultId) {
            var query = 'select * from social_media where id = ?';
            var params = [resultId];
            return db.querySingleRow(query, params).then(function(result) {
                logger.debug(scriptName + ' Ending .... ');
                return result;
            });
        });
    }
    else {
        //var query = 'select * from social_media where application_id = ? and applicant_ref_id = ? and source = ?';
        query = 'update social_media set extended_token = ? , update_date = ?,  expire_date = ?, profile_data = ?  where id = ?';
        params.push(extendedToken);
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
        var extDate = new Date(now.getTime() + (expireSeconds * 1000));
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', extDate));
        params.push(JSON.stringify(profileData));
        params.push(id);

        return using(db.update(query, params), function(result) {
            logger.debug(scriptName + ' Ending .... ');
            return result;
        });
    }
};


function getExtendedToken(accessToken) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    logger.debug(scriptName + ' Starting ....');
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
            logger.debug(scriptName + ' Ending .... ');
            return {"httpResponse" : httpResponse, "s2mResponse" : undefined};
        }).catch(function (httpResponse) {
            logger.debug(httpResponse.error.error.message);
            var httpResponseOptions = {};
            httpResponseOptions.internalMessage = {"internal" : "no",
                "script" : scriptName,
                "processStep" : "SOCIAL_MEDIA_FACEBOOK",
                "message" :  httpResponse.message};
            httpResponseOptions.errorCode = "FAILED-SOCIAL-MEDIA-FACEBOOK";
            httpResponseOptions.message = httpResponse.error.error.message;
            var s2mResponse  = new S2mResponse('FAILURE_SOCIAL_MEDIA', httpResponseOptions);
            logger.debug(scriptName + ' Ending .... ');
            return {"httpResponse" : undefined, "s2mResponse" : s2mResponse};
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

    var socialMedia = req.socialMediaData || [];
    if(socialMedia.length == 0) {
        logger.debug('No Social Medial data found on request');
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
                var socialMediaId = undefined;
                var cmdType ='INSERT';
                if(!_.isNil(result)) {
                    cmdType = 'UPDATE';
                    if(!_.isNil(result.extended_token)) {
                        extendedToken = result.extended_token;
                        socialMediaId = result.id;
                    };
                };
                getExtendedToken(extendedToken).then(function(socialHttpResponse) {
                    //logger.debug(socialHttpResponse.socialHttpResponse);
                    if(socialHttpResponse.s2mResponse != undefined) {
                    //if(!_.isNull(socialHttpResponse.s2mResponse)) {
                        req.s2mResponse = socialHttpResponse.s2mResponse;
                        logger.debug(scriptName + ' Continue ....');
                        next();
                    } else {
                      //  logger.debug(socialHttpResponse.httpResponse);
                        socialHttpResponse.httpResponse  = socialHttpResponse.httpResponse.replace(new RegExp('&', 'g'), '" , "');
                        socialHttpResponse.httpResponse  = socialHttpResponse.httpResponse.replace(new RegExp('=', 'g'), '" : "');
                        var socialHttpResponseJson = JSON.parse('{"' + socialHttpResponse.httpResponse + '"}');

                        FB.options({version: process.env.FACEBOOK_API_VERSION, accessToken: socialHttpResponseJson.access_token,
                            appId: process.env.FACEBOOK_APP_ID, appSecret: process.env.FACEBOOK_APP_SECRET});
                        FB.api('me', { fields: ['id', 'name', 'email', 'is_verified','verified','friends','family','significant_other','relationship_status', 'work'] }, function (facebookProfile) {
                            if(!facebookProfile || facebookProfile.error) {
                                logger.debug('error occurred' + res.error);

                            }
                            else {
                                logger.debug('Facebook :' + JSON.stringify(facebookProfile));
                            }
                            updateSocalMedia(cmdType, req.appInfo.getId(), applicantTransaction.getApplicantRefId(),socialMediaSource,
                                account.attributes.accessToken,socialHttpResponseJson.access_token,socialHttpResponseJson.expires, 'active', null, facebookProfile, socialMediaId).then(function(sesult) {
                                next();
                            });
                        });
                    };
                });
            });
        }
    }
};
