var _ = require('lodash');
var S2mResponse = require('../common/s2mHttpResponse');
var db = require("../helpers/mysql-helper");
var logger = require('../helpers/log-helper');
var rp = require('request-promise');
var socialMediaHelper = require("../helpers/social-media-helper");
var Promise = require('bluebird');
var using = Promise.using;
var dateFormat = require('date-format');

const socialMediaSource = 'linkedIn';

function updateSocalMedia(cmdType, applicatonId, applicantRefId, source, accessToken, extendedToken, expireSeconds, status, attributes, id) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    logger.debug(scriptName + ' Starting ....');
    var query = undefined;
    var params = [];
    var now = new Date();
    if(cmdType === 'INSERT' ) {
        query = 'insert into social_media(application_id,applicant_ref_id,source, access_token, extended_token, status, attributes, create_date, update_date, expire_date) values(?,?,?,?,?,?,?,?,?,?)';
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
        query = 'update social_media set extended_token = ? , update_date = ?,  expire_date = ? where id = ?';
        params.push(extendedToken);
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
        var extDate = new Date(now.getTime() + (expireSeconds * 1000));
        params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', extDate));
        params.push(id);

        return using(db.update(query, params), function(result) {
            logger.debug(scriptName + ' Ending .... ');
            return result;
        });
    }
}

function getSocalMedia(applicatonId, applicantRefId) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    logger.debug(scriptName + ' Starting ....');
    var query = 'select * from social_media where application_id = ? and applicant_ref_id = ? and source = ?';
    var params = [applicatonId , applicantRefId, socialMediaSource];
    return using(db.querySingleRow(query, params), function(result) {
        logger.debug(scriptName + ' Ending .... ');
        return result;
    });
}

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        logger.error('No Appicant Transaction found in request object');
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {
            "internal": "yes",
            "script": scriptName,
            "processStep": "SOCIAL_MEDIA",
            "message": "No Appicant Transaction found in request object"
        };
        httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
        req.s2mResponse = new S2mResponse('SERVICE_ERROR', httpResponseOptions);

        logger.debug(scriptName + ' Continue ....');
        next();

    };
    var socialMedia = req.socialMediaData || undefined;

    var socialMedia = req.socialMediaData || [];
    if(socialMedia.length == 0) {
        logger.debug('No Social Medial data found on request');
        logger.debug(scriptName + ' Continue ....');
        next();
    }
    else {
        var account = _.find(socialMedia, { 'source': socialMediaSource});
        if(_.isNil(account)) {
            logger.debug('twitter was not one of the social media accounts');
            logger.debug(scriptName + ' Continue ....');
            next();
        }
        else {
            if (account.attributes == 'Y') {


                getSocalMedia(req.appInfo.getId(), applicantTransaction.getApplicantRefId()).then(function (result) {
                    var extendedToken = account.attributes.accessToken;
                    var socialMediaId = undefined;
                    if (_.isNil(result)) {

                        updateSocalMedia('INSERT', req.appInfo.getId(), applicantTransaction.getApplicantRefId(), socialMediaSource,
                            null, null, 0, 'active', null, null).then(function (sesult) {
                            logger.debug(scriptName + ' Continue ....');
                            next();
                        });
                    }
                    else {
                        logger.debug(scriptName + ' Continue ....');
                        next();
                    }
                });
            } else {
                logger.debug(scriptName + ' Continue ....');
                next();
            }

        }
    }
};

