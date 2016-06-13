var _ = require('lodash');
var Promise = require('bluebird');
var using = Promise.using;
var mysql = require("../helpers/mysql");
var logger = require('../helpers/log-helper');

function querySingleRow(query, params) {
    return using( mysql.query(query, params), function(results){
        if(results.length !== 1 ) {
            if (results.length > 1) {
                logger.error('mult rows returned when should be 1');
                return undefined;
            }
            else {
                logger.debug('Nor Rows found for Query: ' + query + ' Vaues: ' + _.flatten(params));
            }
            return undefined;
       }
       else{
            return results[0];
       };
    }).catch(function (err) {
        logger.error(JSON.stringify(err))
        return undefined;
    });

};

var querySingleRowJsonId = function (query, params) {
    return using( mysql.query(query, params), function(results){
        if(results.length !== 1 ) {
            if (results.length > 1) {
                console.log('mult rows returned when should be 1');
                return undefined;
            }
            return undefined;
        }
        else{
            return results[0];
        };
    });
};

var insertReturnId = function (query, params) {
    return using( mysql.command(query, params), function(results){
        var id = results.insertId || undefined;
        return id;
    }).catch(function(err) {
        console.log(JSON.stringify(err));
        return undefined;
    });

};


var update = function (query, params) {
    var response = {};
    response.rowsChanged = 0;
    response.error       = undefined;
    return using( mysql.command(query, params), function(results){
        var rowsChanged = results.changedRows || 0;
        response.rowsChanged = rowsChanged;
        return response
    })
    .catch(function(err) {
      //  console.log(JSON.stringify(err));
        response.error = err;
        return response
    });

};

var logError = function (type, message, details, req) {
    var queryColumns = 'insert into error_log (type, message, details' ;
    var queryValues  = ' values(?, ?, ?';
    var params = [];
    params.push( type);
    params.push(message);
    params.push(JSON.stringify(details || null));
    var appInfo = req.appInfo || undefined;
    if(!_.isNil(appInfo)) {
        var appId = appInfo.id || undefined;
        if(!_.isNil(appId)) {
            queryColumns = queryColumns + ', application_id';
            queryValues  = queryValues + ', ?';
            params.push(appId);
        };  
    };


    var applicantRefId = req.body.applicantRefId || undefined;
    if(!_.isNil(applicantRefId)) {
        queryColumns = queryColumns + ', applicant_ref_id';
        queryValues  = queryValues + ', ?';
        params.push(applicantRefId);
    };
    
    var query =  queryColumns + ')' + queryValues + ')';
    
    return using( mysql.command(query, params), function(results){
        var rowsChanged = results.changedRows || undefined;
        return rowsChanged
    }).catch(function(err) {
        console.log(JSON.stringify(err));
        return undefined;
    });

};

var ping = function() {
    return mysql.query('select 1');
};

module.exports = {
    ping           : mysql.ping,
    query          : mysql.query,
    command        : mysql.command,
    querySingleRow : querySingleRow,
    insertReturnId : insertReturnId,
    update         : update,
    logError       : logError
};
