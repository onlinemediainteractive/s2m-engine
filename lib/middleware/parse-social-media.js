var _ = require('lodash');
var S2mResponse = require("../common/s2mHttpResponse");
var logger = require('../helpers/log-helper');
var db = require("../helpers/mysql-helper");
var Promise = require('bluebird');
var using = Promise.using;

function inactivateSocalMedia(applicantRefId, sourceList) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    logger.debug(scriptName + ' Starting ....');
    var query = undefined;
    var params = [];
    params.push('inactive');
    params.push(applicantRefId);
    params.push(sourceList[0].source);
    query = 'update social_media set status = ? where applicant_ref_id = ? and (source = ? ';
    if(sourceList.length > 1) {
        query =   query + ' or source = ? ';
        params.push(sourceList[1].source);
    }
    if(sourceList.length > 2) {
        query =   query + ' or source = ? ';
        params.push(sourceList[2].source);
    }
    query =   query + ')';
    logger.debug("query :  " + query);
    logger.debug("params :  " + params);
    return db.update(query, params). then(function(result) {
            logger.debug(scriptName + ' Ending .... ');
            return result;
    });

}

module.exports = function(req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.main';
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    req.socialMediaData = [];
    //req.deleteSocialMediaData = [];

    var socialMedia = req.body.socialMedia || undefined;
    if(_.isNil(socialMedia)) {
        logger.debug('No Social Media Elements found in request body')
        logger.debug(scriptName + ' Continue ....');
        next();
    }
    else {
        var sourcelist = [];
        _.forEach(socialMedia, function(value, key) {
            logger.debug("source :  " + key);
            logger.debug("attributes : " + value);

            if(key == 'facebook') {
               if(value.accessToken !== '') {
                   req.socialMediaData.push({"source" : key, "attributes" : value});
               } else {
                   sourcelist.push({"source" : key})
               }
            }
            else {
                if(value == 'Y') {
                    req.socialMediaData.push({"source" : key, "attributes" : value});
                }
                else {
                    sourcelist.push({"source" : key})
                }

            }
            //if((value.accessToken !== 'N') && (value.userId !== 'N') && (value.accessToken !== '') && (!_.isNil(value.accessToken))) {
            //    req.socialMediaData.push({"source" : key, "attributes" : value});
            //}
            //else {

            //    sourcelist.push({"source" : key})
                //req.deleteSocialMediaData = [{"status": 'inactive', "applicantRefId" : applicantRefId, "source" : key}];
                //inactivateSocalMedia('inactive', req.applicantTransaction.getApplicantRefId(), key).then(function (resultId) {
                //    logger.debug('Social media rows updated : ' + resultId.rowsChanged);
                    //logger.debug(scriptName + ' Continue ....');
                    //next();
                //});
            //}
        });
        if (sourcelist.length > 0) {
            inactivateSocalMedia(req.applicantTransaction.getApplicantRefId(), sourcelist).then(function (resultId) {
                //    logger.debug('Social media rows updated : ' + resultId.rowsChanged);
                logger.debug(scriptName + ' Continue ....');
                next();
            });
        }
        else {
            logger.debug(scriptName + ' Continue ....');
            next();
        }

    };
    //logger.debug(scriptName + ' Continue ....');
    //next();
}
