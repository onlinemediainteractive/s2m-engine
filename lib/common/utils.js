var logger = require('../helpers/log-helper');


exports.daysBetween = function(dateFrom, dateTo) {

    var ndays = ((dateTo.getTime() - dateFrom.getTime()) / 1000 / 86400);

    return ndays;
};

exports.isProduction = function(){

    var response = true;

    if((process.env.NODE_ENV == 'development') || (process.env.NODE_ENV == 'qa')){
        response = false;
    }
    return response;

};


exports.displayConfig = function(title, config){

    logger.info('  ');
    logger.info('************************ ' +   title + ' ************************');
    logger.info('  ');
    logger.info(JSON.stringify(config, null, 10));
    logger.info('  ');
    logger.info('************************************************************');
    logger.info('  ');

};


exports.httpResponseBuilder = function(title, config){

    var options = {};


    return options;
    

};

//module.exports = utils;
