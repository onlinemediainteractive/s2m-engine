var info = require('debug')('s2m-eng:info');
var error = require('debug')('s2m-eng:error');
var fatal = require('debug')('s2m-eng:fatal');
var debug = require('debug')('s2m-eng:debug');


module.exports.info    = info;
module.exports.error   = error;
module.exports.fatal   = fatal;
module.exports.debug   = debug;
