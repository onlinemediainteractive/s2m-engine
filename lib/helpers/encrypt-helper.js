var _ = require('lodash');
var config = require('config');
var securityConfig = config.get('Security.config');
var node_cryptojs = require('node-cryptojs-aes');
var CryptoJS = node_cryptojs.CryptoJS;
var JsonFormatter = node_cryptojs.JsonFormatter;
var logger = require('../helpers/log-helper');

module.exports.encryptDbString = function(message ) {
    if(_.isNil(message)) {
        logger.debug('String to be encrupted is Blank');
        return message;
    };

    if((process.env.NODE_ENV == 'development') && (!securityConfig.dbEncryption)) {
        logger.debug('Database Encription is turned off');
        return message;
    }
    else {
      var passphrase = process.env.MYSQL_PASSPHRASE;
      if(_.isNil(passphrase)) {
          logger.fatal('MYSQL PASSPRASE value is blank'); 
          throw (new Error('MYSQL passphrase is blank'));
      };
      var encrypted = CryptoJS.AES.encrypt(message, process.env.MYSQL_PASSPHRASE, { format: JsonFormatter });

      var encrypted_json_str = encrypted.toString();

      //logger.debug("serialized CipherParams object: " + encrypted_json_str);
      return  encrypted_json_str;

    };
};


module.exports.decryptDbString = function(message) {
    if(_.isNil(message)) {
        logger.debug('String to be encrupted is Blank');
        return message;
    };

    if((process.env.NODE_ENV == 'development') && (!securityConfig.dbEncryption)) {
        logger.debug('Database Encription is turned off');
        return message;
    }
    else {
        var passphrase = process.env.MYSQL_PASSPHRASE;
        if(_.isNil(passphrase)) {
            logger.fatal('MYSQL PASSPRASE value is blank');
            throw (new Error('MYSQL passphrase is blank'));
        };

        var decrypted = CryptoJS.AES.decrypt(message, process.env.MYSQL_PASSPHRASE, { format: JsonFormatter });
        var decrypted_str = CryptoJS.enc.Utf8.stringify(decrypted);

       // logger.debug('decrypted string: '  + decrypted_str);
        return  decrypted_str;

    };
};

