var _ = require('lodash');
var S2mResponse = require("../common/s2mHttpResponse");
var logger = require('../helpers/log-helper');
var db = require("../helpers/mysql-helper");
var Promise = require('bluebird');
var using = Promise.using;

function inactivateSocalMedia(status, applicantRefId, source) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.' + arguments.callee.toString().match(/function ([^\(]+)/)[1];
    logger.debug(scriptName + ' Starting ....');
    var query = undefined;
    var params = [];

    query = 'update social_media set status = ? where applicant_ref_id = ? and source = ?';
    params.push(status);
    params.push(applicantRefId);
    params.push(source);
    return using(db.update(query, params), function(result) {
            logger.debug(scriptName + ' Ending .... ');
            return result;
    });

}

module.exports = function(req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.main';
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    req.socialMediaData = [];
    req.deleteSocialMediaData = [];

    var socialMedia = req.body.socialMedia || undefined;
    if(_.isNil(socialMedia)) {
        logger.debug('No Social Media Elements found in request body')
        logger.debug(scriptName + ' Continue ....');
        next();
    }
    else {

        _.forEach(socialMedia, function(value, key) {
           // logger.debug("source :  " + key);
           // logger.debug("attributes : " + value);

            if((value.accessToken !== 'N') && (value.userId !== 'N') && (value.accessToken !== '') && (!_.isNil(value.accessToken))) {
                req.socialMediaData.push({"source" : key, "attributes" : value});
            }
            else {
                inactivateSocalMedia('inactive', req.applicantTransaction.getApplicantRefId(), key).then(function (resultId) {
                    logger.debug('Social media rows updated : ' + resultId.rowsChanged);
                    //logger.debug(scriptName + ' Continue ....');
                    //next();
                });
            }
        });
        //logger.debug(scriptName + ' Continue ....');
        //next();
    };
    logger.debug(scriptName + ' Continue ....');
    next();
}
