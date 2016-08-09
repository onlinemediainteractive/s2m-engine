var _ = require('lodash');
var S2mResponse = require('../common/s2mHttpResponse');
var db = require("../helpers/mysql-helper");
var logger = require('../helpers/log-helper');
var rp = require('request-promise');
var socialMediaHelper = require("../helpers/social-media-helper");
var Promise = require('bluebird');
var using = Promise.using;

function getExtendedToken(accessToken) {
    var options = {};
    var fullUrl = 'https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&' +
                  'client_id=' + process.env.FACEBOOK_APP_ID + '&' +
                  'client_secret=' + process.env.FACEBOOK_APP_ID + '&' +
                  'fb_exchange_token=' + accessToken;
    options = {
        url : fullUrl,
        method : 'GET',
        simple: true,
        json: true
    };

    return  rp(options)
        .then(function (httpResponse) {
            logger.debug(httpResponse);
            httpResponse.error = undefined;
            return httpResponse;
        }).catch(function (httpResponse) {
            logger.debug(httpResponse);
            return httpResponse;
        });

};

function processSocialMedia(applicationId, applicantRefId, socialMediaData) {
    return using(socialMediaHelper.getSocialMediaData(applicationId, applicantRefId, socialMediaData.source), function(result) {
        if(!_.isNil(result)) {
            return result;
        } else {
            return socialMediaHelper.insertSocialMediaData(applicationId, applicantRefId, socialMediaData.source, socialMediaData.attributes);
        };
    });
};

function processSocialMedia2(mediaType, params) {
  var result = undefined;
  //var key = undefined;
  result = {};
  result.key = mediaType;
  result.status = 'failure';
  result.checkDate = new Date;
  if(mediaType == 'facebook') {
    if(_.isNil(params))  {
        result.reason = 'No parameters';
        return result;
    } else if(_.isNil(params.userId))  {
        result.reason = 'No userId parameters';
        return result;
    } else if(params.userId == 'N')  {
          result.reason = 'UserId set to N';
          return result;
    } else {
        getExtendedToken(params.accessToken).then(function(httpResponse) {
            logger.debug(httpResponse)
        });
        //result.status = 'success';
        //result.reason = 'valid access code';
        //result.attributes = undefined;

        //return result;
    }
  } else if(mediaType == 'linkedIn') {
      if(_.isNil(params))  {
          result.reason = 'No parameters';
          return result;
      } else if(_.isNil(params.userId))  {
          result.reason = 'No userId parameters';
          return result;
      } else if(params.userId == 'N')  {
          result.reason = 'UserId = N';
          return result;
      } else {
          result.linkedIn.status = 'success';
          result.linkedIn.reason = 'UserId = Y';
          return result;
      };
  } else if(mediaType == 'twitter') {
      if(_.isNil(params))  {
          result.reason = 'No parameters';
          return result;
      } else if(_.isNil(params.userId))  {
          result.reason = 'No userId parameters';
          return result;
      } else if(params.userId == 'N')  {
          result.reason = 'UserId = N';
          return result;
      } else {
          result.status = 'success';
          result.reason = 'UserId = Y';
          return result;
      };
  } else {
      result.reason = 'Invalid Socal Media type : ' + mediaType;
  };

  return result;

};

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
    if(_.isNil(socialMedia)) {// && _.isNil(applicantTransaction.getSocialMediaData())) {
        logger.debug(scriptName + ' Continue ....');
        return next();
    };

    //if(_.isNil(socialMedia)) {
    //    socialMedia = applicantTransaction.getSocialMediaData();
    //};

    var socalMediaVerification = [];
    var result = undefined;
    _.forIn(socialMedia, function(value, key) {
        //console.log(key);
        //console.log(value);
        //result = processSocialMedia(req.appInfo.getId(), applicantTransaction.getApplicantRefId(), key, value);
        //_.assign(socalMediaVerification, {key : result});

        //socalMediaVerification.push(result);
        //console.log(JSON.stringify(socalMediaVerification));
        processSocialMedia(req.appInfo.getId(), applicantTransaction.getApplicantRefId(), value).then(function(result) {
            logger.debug(scriptName + ' Continue ....');
            next();
        });

    });
    //var responseStatus = 'success';
    //db.saveVerificationStepStatus(req.applicantTransaction.getId(), socalMediaVerification, responseStatus, 'social_media_verification').then(function(result) {
    //    if(!_.isNil(result)) {
    //        req.applicantTransaction.setSocialMediaVerification(JSON.stringify(socalMediaVerification));
    //        req.applicantTransaction.setSocialMediaVerificationStatus(responseStatus);
    //        req.applicantTransaction.setUpdateDate(new Date);
    //    }
    //    else {
    //        //TODO need to log error
    //        logger.error(spaces + 'Applicant Transaction Record was not update for ssn_verification');
    //    };
    //    logger.debug(scriptName + ' Continue ....');
    //    next();
    //});
    //console.log(JSON.stringify(socalMediaVerification));
    //req.applicantTransaction.setSocialMediaVerification(JSON.stringify(socalMediaVerification));
    //req.applicantTransaction.setSocialMediaVerificationStatus(responseStatus);
    //req.applicantTransaction.setUpdateDate(new Date);

    //logger.debug(scriptName + ' Continue ....');
    //next();

};
