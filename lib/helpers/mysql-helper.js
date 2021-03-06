var _ = require('lodash');
var Promise = require('bluebird');
var using = Promise.using;
var mysql = require("../helpers/mysql");
var logger = require('../helpers/log-helper');
var encrypt = require('../helpers/encrypt-helper');
var dateFormat = require('date-format');

function querySingleRow(query, params) {
    return using( mysql.query(query, params), function(results){
        if(results.length !== 1 ) {
            if (results.length > 1) {
                logger.error('mult rows returned when should be 1');
                return undefined;
            }
            else {
                logger.debug('No Rows found for Query: ' + query + ' Vaues: ' + _.flatten(params));
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
                logger.error('mult rows returned when should be 1');
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
        logger.error(JSON.stringify(err) + ' Query:' + query + ' Params: ' + params);
        return undefined;
    });

};


var selectAnyById = function (id, tableName) {
    var query = 'select * from ' + tableName + ' where id = ?';
    var params = [];
    params.push(id);
    return using(querySingleRow(query, params), function(results){
        return results;
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
        logger.error(JSON.stringify(err));
        logger.error('Query  :' + query);
        logger.error('Params :' + _.flatten(params));
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

function makeVerificationBackup(transactionId, subscribeReq) {

    var spaces = '-- ';
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(spaces + scriptName + ' Starting ....');
    var query = 'insert into applicant_transaction_history ' +
        '(id,application_id,applicant_ref_id,ssn_verification,identity_verification,national_criminal_verification,' +
        'sex_offender_verification,create_date,update_date,applicant_creation,ssn_verification_status,' +
        'identity_verification_status,national_criminal_verification_status,sex_offender_verification_status,' +
        'facebook_verification,facebook_verification_status,applicant_creation_status,' +
        'identity_verification_attempts,social_media_data,verifications,activities, national_criminal_verification_source, sex_offender_verification_source) select * from applicant_transaction where id = ?';

    var params = [];
    if(subscribeReq == 'yes') {
        params.push(transactionId);
    }
    else {
        params.push(-1);
    }

    return mysql.command(query, params).then(function(result) {
        logger.debug("result : " + JSON.stringify(result));
        var id = undefined;
        if(!_.isNil(result)) {
            if(subscribeReq == 'no') {
                //params.push(transactionId);
                id = 0;
            }
            else {
                id = result.insertId || -1;
                if(id == -1) {
                    logger.error(spaces + 'Applicant Transaction Record History was not inserted for Transaction id ' + transactionId);
                    logger.error(spaces + 'Query : ' + query);
                    logger.error(spaces + 'Params : ' + params[0]);
                }

            }
        }
        else {

            if(subscribeReq == 'yes') {
                id = -1;
                logger.error(spaces + 'Applicant Transaction Record History was not inserted for Transaction id ' + transactionId);
                logger.error(spaces + 'Query : ' + query);
                logger.error(spaces + 'Params : ' + params[0]);
            }
            else {
                id = 0;
            }
        }
        logger.debug(spaces + scriptName + ' Returning ....');
        return id;
    }).catch(function(err) {
        logger.error(spaces + 'Sql error : ' + JSON.stringify(err));
        logger.error(spaces + 'Applicant Transaction Record History was not inserted for Transaction id ' + transactionId);
        logger.error(spaces + 'Query : ' + query);
        logger.error(spaces + 'Params : ' + params[0]);
        var id = undefined;
        if(subscribeReq == 'no') {
            var id = 0;
        }
        else {
            var id = -1;
        }

        return id;
    });
};

function saveVerificationStepStatus(transactionId, jsonValue, status, columnName, criminalSource) {

    var spaces = '-- ';
    var scriptName = __filename.split(/[\\/]/).pop();
    logger.debug(spaces + scriptName + ' Starting ....');
    var query = 'update applicant_transaction ' +
        'set ' + columnName + ' = ? ' +
        ', ' + columnName + '_status = ? ' +
        ', update_date = ? ' ;
    
    if(columnName == 'identity_verification' && status !== 'success') {
        query =  query +  ', identity_verification_attempts = identity_verification_attempts + 1 ';
    };
    if(!_.isNil(criminalSource)) {
        query =  query + ', ' + columnName + '_source = ?';

    }
    query =  query + ' where id = ?';

    var now = new Date();
    var params = [];

    params.push(encrypt.encryptDbString(JSON.stringify(jsonValue)));
    params.push(status);
    //params.push(criminalSource);
    params.push(dateFormat.asString('yyyy-MM-dd hh:mm:ss', now));
    //params.push(req.applicantTransaction.getId());
    if(!_.isNil(criminalSource)) {
        params.push(criminalSource)
    }
    params.push(transactionId);



    return update(query, params).then(function(result) {
        //if(!_.isNil(result)) {
        //    req.applicantTransaction.setSsnVerification(ssnVerificationJson);
        //    req.applicantTransaction.setUpdateDate(now);
        //}
        //else {
        if(_.isNil(result) || result.changedRows == 0) {
            //TODO need to log error
            logger.error(spaces + 'Applicant Transaction Record was not update for ' + columnName);
            logger.error(spaces + 'Query : ' + query);
            logger.error(spaces + 'Params : ' + _.flatten(params));
        }
        logger.debug(spaces + scriptName + ' Returning ....');
        return result;
    });
};

module.exports = {
    ping           : mysql.ping,
    query          : mysql.query,
    command        : mysql.command,
    querySingleRow : querySingleRow,
    insertReturnId : insertReturnId,
    update         : update,
    logError       : logError,
    saveVerificationStepStatus : saveVerificationStepStatus,
    selectAnyById : selectAnyById,
    makeVerificationBackup : makeVerificationBackup,
};
