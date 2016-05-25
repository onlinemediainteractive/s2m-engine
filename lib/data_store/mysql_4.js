const mysql = require('mysql');
const Connection = require('mysql/lib/Connection');
const Pool = require('mysql/lib/Pool');
const Promise = require('bluebird');

Promise.promisifyAll([
    Connection,
    Pool
]);

var OkPacket = {
        fieldCount: 0,
        affectedRows: 0,
        insertId: 0,
        serverStatus: 2,
        warningCount: 0,
        message: '',
        protocol41: true,
        changedRows: 0
    }

const pool = mysql.createPool({
      host           : process.env.MYSQL_HOST,
      port           : process.env.MYSQL_PORT,
      user           : process.env.MYSQL_USER_NAME,
      password       : process.env.MYSQL_USER_PASSWORD,
      database       : process.env.MYSQL_DEFAULT_SCHEMA,
      connectionLimit: process.env.MYSQL_CONNECTION_LIMIT || 10
    });

const getSqlConnection = function() {
    return pool.getConnectionAsync().disposer(function(connection) {
        connection.release();
    });
};

function getPoolConnection() {
    return new Promise(function(resolve, reject) {
        // If getConnection throws here instead of getting
        // an exception we're getting a rejection thus
        // producing a much more consistent API.
        var connection = pool.getConnection();
        connection.on("ready", function() {
            // When a connection has been established
            // mark the promise as fulfilled.
            resolve(connection);
        });
        connection.on("error", function(e) {
            // If it failed connecting, mark it
            // as rejected.
            reject(e); //  e is preferably an `Error`
        });
    });
}
module.exports = {
    getSqlConnection: getSqlConnection,
    getPoolConnection : getPoolConnection
};

//const getConnection = function() {
//    return pool.getConnectionAsync().then(function(connection){
//            return connection;
//}).disposer(function(connection){
//        return connection.releaseAsync();
//});
//};


/*var mysql = require("mysql");
var Promise = require("bluebird");
var using = Promise.using;
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER_NAME,
    password: process.env.MYSQL_USER_PASSWORD,
    database: process.env.MYSQL_DEFAULT_SCHEMA,
    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT || 10
});


var getConnection = function () {
    return pool.getConnectionAsync().disposer(function (connection) {
        return connection.destroy();
    });
};
var query = function (query, params) {
    return using(getConnection(), function (connection) {
        return connection.queryAsync(query, params);
    });
};


var ping = function () {
    return using(getConnection(), function (connection) {
        return connection.queryAsync('Select 1');
    });
};


module.exports = {
   ping: ping
};*/


//var mysql = require('promise-mysql');


//var type = 'MySql';

//var pool = mysql.createPool({
//    host: process.env.MYSQL_HOST,
//    port: process.env.MYSQL_PORT,
//    user: process.env.MYSQL_USER_NAME,
//    password: process.env.MYSQL_USER_PASSWORD,
//    database: process.env.MYSQL_DEFAULT_SCHEMA,
//    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT || 10
//});


//exports.ping = function(callback) {
//    pool.query('Select 1').then(function(rows){
        // Logs out a list of hobbits
//        callback(undefined);
//    }).catch(function(error){
       // console.log(error + ' ' + type);
//        callback(false);

//    });
//}

//exports.query = function(query, params) {
//    console.log('query:' + query);
//    console.log('params:' + params);
//    pool.query(query,params).then(function(rows){
      // Logs out a list of hobbits
//         console.log('mysql query:' + JSON.stringify(rows));
      // done(undefined, rows);
//        return rows;
        //  return rows;
//  }).catch(function(error){
      // console.log(error + ' ' + type)
       // done(error, undefined);
//        return error;

//  });
//};*/





