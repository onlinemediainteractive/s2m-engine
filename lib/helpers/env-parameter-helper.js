var _ = require('lodash');
var logger = require('./log-helper');

module.exports.validateEnvParams = function() {

    var fatalError = false;
    var nodeEnv = process.env.NODE_ENV;
    if(_.isNil(nodeEnv)) {
        fatalError = true;
        logger.fatal('NODE_ENV value cannot be blank');
    };
    var passphrase = process.env.MYSQL_PASSPHRASE;
    if(_.isNil(passphrase)) {
        fatalError = true;
        logger.fatal('MYSQL PASSPRASE value cannot be blank');
    };


    return fatalError;
}
