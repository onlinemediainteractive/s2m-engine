var info = require('debug')('s2m-eng:info');
var error = require('debug')('s2m-eng:error');
var fatal = require('debug')('s2m-eng:fatal');
var debug = require('debug')('s2m-eng:debug');

info.log = console.info.bind(console);
error.log = console.info.bind(console);
fatal.log = console.info.bind(console);
debug.log = console.info.bind(console);

module.exports.info    = info;
module.exports.error   = error;
module.exports.fatal   = fatal;
module.exports.debug   = debug;
