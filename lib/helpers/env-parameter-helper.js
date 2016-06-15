var _ = require('lodash');
var logger = require('./log-helper');

module.exports.validateEnvParams = function() {

    var fatalError = false;
    var passphrase = process.env.MYSQL_PASSPHRASE;
    if(_.isNil(passphrase)) {
        fatalError = true;
        logger.fatal('MYSQL PASSPRASE value cannot be blank');
    };


    return fatalError;
}
