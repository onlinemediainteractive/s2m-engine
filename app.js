var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var stormpath = require('express-stormpath');
var socalstormpath = require('express-stormpath');
var routes = require('./routes/index');
var apiV1 = require('./routes/v1');
var apiPing = require('./routes/ping');
var apiHealthCheck = require('./routes/health-check');
var logRequest =  require('./lib/middleware/log-request');
var continueProcess =  require('./lib/middleware/continue-process');
var S2mResponse = require('./lib/common/s2mHttpResponse');
var _ = require('lodash');
var envCheck = require('./lib/helpers/env-parameter-helper');
var logger = require('./lib/helpers/log-helper');

//console.log('before env param check');
var fatalError = envCheck.validateEnvParams();
if(fatalError) {
    logger.fatal(' ');
    logger.fatal('***************************************');
    logger.fatal('Environment Varables Not Set Correctly');
    logger.fatal('Exiting Server Start Up Process');
    logger.fatal('***************************************');
    process.exit(1);
};


var logReq = function(req, res, next) {
    if(req.originalUrl !==  '/healthcheck') {
        logger.debug(" *** Incoming request begin *** ");
        logger.debug(' Http Method : ' +  req.method);
        logger.debug(' Http Url    : ' +  req.originalUrl);

        if(_.isNil(req.body)) {
            logger.debug(' Http Body  : Request is Empty !!!!');
            req.ssn = null;
        }
        else {
            if(!_.isNil(req.body.ssn)) {
                req.ssn = req.body.ssn;
                //var bodyStr = JSON.stringify(req.body);
                //var body = JSON.parse(bodyStr);
                req.body.ssn = "***-**-****";

            }
            logger.debug(' Http Body   : ' +  JSON.stringify(req.body));
        }
        //logger.debug(' Http Body   : ' +  JSON.stringify(req.body || 'No Body Found !!!!'));
        logger.debug(" *** Incoming request end *** ");
    }
    //else {
    //    logger.debug('healthcheck');
    //}
    next(); // Passing the request to the next handler in the stack.
}

var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use(stormpath.init(app, {
    debug: 'verbose'
}));

app.use(logReq);

app.use('/', routes);
app.use('/v1', apiV1);
app.use('/ping', apiPing);
app.use('/healthcheck', apiHealthCheck);


app.use(morgan('combined'));




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var scriptName = __filename.split(/[\\/]/).pop();
  console.log(scriptName + ' Starting 404 Exception Handling ....');
  console.log('method : ' +  req.method);
  console.log('url : ' +  req.originalUrl);
  console.log('body: ' +  JSON.stringify(req.body));
  var err = new Error('Not Found');
  err.status = 404;
  req.error = err;
  var httpResponseOptions = {};
  httpResponseOptions.message = 'Invalid Url';
  httpResponseOptions.internalMessage = {"internal" : "yes",
        "script" : scriptName,
        "processStep" : "N/A",
        "message" :  "Url Not Found"};
  //httpResponseOptions.errorCode = "INVALID_URL";
  req.s2mResponse  = new S2mResponse('404', httpResponseOptions);
  console.log(scriptName + ' 404 Exception Handling Continue ....');
  //logRequest(req, res, next);
  //next();
  continueProcess(req,res,next);

});



// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  var scriptName = __filename.split(/[\\/]/).pop();
  console.log(scriptName + ' Starting Exception Handling for Error :' + err.message + ' ....');


    if(!_.isNil(req.s2mResponse))
        continueProcess(req,res,next);
    else{
        var httpResponseOptions = {};
        httpResponseOptions.internalMessage = {"internal" : "yes",
            "script" : scriptName,
            "processStep" : "N/A",
            "message" :  err.message};
        httpResponseOptions.errorCode = "INTERNAL-SERVICE-ERROR";
        req.s2mResponse  = new S2mResponse('SERVICE_ERROR', httpResponseOptions);
        continueProcess(req,res,next);
    };
});


module.exports = app;
