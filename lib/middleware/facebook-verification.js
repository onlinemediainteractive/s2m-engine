var logger = require('../helpers/log-helper');




module.exports = function (req, res, next) {
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(scriptName + ' Starting ....');

    var applicantTransaction = req.applicantTransaction || undefined;

    if (_.isNil(applicantTransaction)) {
        req.s2mResponse = new S2mResponse('INTERNAL_ERR_NO_TRANSACTION');
        logger.error(scriptName + ' Continue ....');
        next();

    };


    logger.debug(scriptName + ' Continue ....');
    next();
}

