var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var stormpath = require('express-stormpath');
var socalstormpath = require('express-stormpath');
var routes = require('./routes/index');
var apiV1 = require('./routes/v1');
var logRequest =  require('./lib/middleware/log-request');
var continueProcess =  require('./lib/middleware/continue-process');
var S2mResponse = require('./lib/common/s2mHttpResponse');
var _ = require('lodash');
var envCheck = require('./lib/helpers/env-parameter-helper');
var logger = require('./lib/helpers/log-helper');
//var graph     = require('fbgraph')

var fatalError = envCheck.validateEnvParams();
if(fatalError) {
    logger.fatal(' ');
    logger.fatal('***************************************');
    logger.fatal('Environment Varables Not Set Correctly');
    logger.fatal('Exiting Server Start Up Process');
    logger.fatal('***************************************');
    process.exit(1);
};

var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use(stormpath.init(app, {
    debug: 'verbose'
}));

//var conf = {
//    client_id:      '1660046770949533'
//    , client_secret:  'f46bf76f7709adb0e29f89d5fa501845'
//    , scope:          'email'
//    , redirect_uri:   'http://localhost:3000/z'
//};

app.use('/', routes);
app.use('/v1', apiV1);

//app.use(socalstormpath.init(app, {
//    debug: 'verbose',
//    application: {
//        href: 'https://api.stormpath.com/v1/directories/4WtIfZQPKFXxN5icV51H0B'
//    }
//}));


app.use(morgan('combined'));




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var scriptName = __filename.split(/[\\/]/).pop();
  console.log(scriptName + ' Starting 404 Exception Handling ....');
  var err = new Error('Not Found');
  err.status = 404;
  req.error = err;
  req.s2mResponse  = new S2mResponse('404');
  console.log(scriptName + ' 404 Exception Handling Continue ....');
  //logRequest(req, res, next);
  next();

});



// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  var scriptName = __filename.split(/[\\/]/).pop();
  console.log(scriptName + ' Starting Exception Handling for Error :' + err.message + ' ....');


    if(!_.isNil(req.s2mResponse))
        continueProcess(req,res,next);
    else{
        req.s2mResponse  = new S2mResponse('UNKNOWN_500', {message : err.message});
        continueProcess(req,res,next);
    };
});


module.exports = app;
