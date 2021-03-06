var _ = require('lodash');
var config = require('config');
var securityConfig = config.get('Security.config');
var node_cryptojs = require('node-cryptojs-aes');
var CryptoJS = node_cryptojs.CryptoJS;
var JsonFormatter = node_cryptojs.JsonFormatter;
var logger = require('../helpers/log-helper');
var utils = require('../common/utils');

utils.displayConfig('Encryption Configuration',securityConfig);

module.exports.encryptDbString = function(message ) {
    if(_.isNil(message)) {
        logger.debug('String to be encrupted is Blank');
        return message;
    };

    //if((process.env.NODE_ENV == 'development') && (!securityConfig.dbEncryption)) {
    if(! utils.isProduction()) {
        logger.debug('Database Encription is turned off');
        return message;
    }
    else {
      if (securityConfig.dbEncryption) {
          var passphrase = process.env.MYSQL_PASSPHRASE;
          if(_.isNil(passphrase)) {
              logger.fatal('MYSQL PASSPRASE value is blank');
              throw (new Error('MYSQL passphrase is blank'));
          };
          var encrypted = CryptoJS.AES.encrypt(message, process.env.MYSQL_PASSPHRASE, { format: JsonFormatter });

          var encrypted_json_str = encrypted.toString();

          return  encrypted_json_str;
      }
      else {

          return message;
      }

    };
};


module.exports.decryptDbString = function(message) {
    if(_.isNil(message)) {
        logger.debug('String to be encrupted is Blank');
        return message;
    };

    //if((process.env.NODE_ENV == 'development') && (!securityConfig.dbEncryption)) {
    if(! utils.isProduction()) {
        logger.debug('Database Encription is turned off');
        return message;
    }
    else {
        if (securityConfig.dbEncryption) {
            var passphrase = process.env.MYSQL_PASSPHRASE;
            if(_.isNil(passphrase)) {
                logger.fatal('MYSQL PASSPRASE value is blank');
                throw (new Error('MYSQL passphrase is blank'));
            };

            var decrypted = CryptoJS.AES.decrypt(message, process.env.MYSQL_PASSPHRASE, { format: JsonFormatter });
            var decrypted_str = CryptoJS.enc.Utf8.stringify(decrypted);

            return  decrypted_str;
        }
        else {
            return message;
        }

    };
};

