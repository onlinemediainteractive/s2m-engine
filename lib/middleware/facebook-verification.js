var rp = require('request-promise');
var logger = require('../helpers/log-helper');


function getStats() {

    
    var options = {};
    var params = {};
    var fullUrl = 'https://graph.facebook.com';

    options = {
        url : fullUrl,
        method : 'GET',
        headers : { 'Authorization': 'Token token=' + process.env.ONFIDO_APIKEY_ID, 'host': onfidoConfig.host, 'path': onfidoConfig.path, },
        body: params,
        simple: true,
        json: true
    };

    return  rp(options)

}

module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        req.s2mResponse = new S2mResponse('INTERNAL_ERR_NO_TRANSACTION');
        logger.error(scriptName + ' Continue ....');
        next();

    };

    req.performedSteps.facebook_verification = "no";
    logger.debug(scriptName + ' Continue ....');
    next();
}

