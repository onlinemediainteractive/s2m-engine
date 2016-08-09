var _ = require('lodash');
var S2mResponse = require("../common/s2mHttpResponse");
var logger = require('../helpers/log-helper');


module.exports = function(req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop() + '.main';
    logger.debug(scriptName + ' Starting ....');
    req.socialMediaData = [];

    var socialMedia = req.body.socialMedia || undefined;
    if(_.isNil(socialMedia)) {
        logger.debug('No Social Media Elements found in request body')
        logger.debug(scriptName + ' Continue ....');
        next();
    }
    else {

        _.forEach(socialMedia, function(value, key) {
            logger.debug("source :  " + key);
            logger.debug("attributes : " + value);

            if((value.accessToken !== 'N') && (value.userId !== 'N')) {
                req.socialMediaData.push({"source" : key, "attributes" : value});
            }

        });
        logger.debug(scriptName + ' Continue ....');
        next();
    };
}
