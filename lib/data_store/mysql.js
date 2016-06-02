
var mysql = require('mysql');
var Connection = require('mysql/lib/Connection');
var Pool = require('mysql/lib/Pool');
var Promise = require('bluebird');
var using = Promise.using;
var _ = require('lodash');

Promise.promisifyAll(Connection.prototype);
Promise.promisifyAll(Pool.prototype);

Pool.prototype.getTransaction = function () {
    return this.getConnectionAsync(
    ).then(function (conn) {
        return conn.beginTransactionAsync(
        ).then(function () { return conn; });
    }).disposer(function(conn, promise) {
        if(promise.isFulfilled()) {
            conn.commitAsync();
        } else {
            conn.rollbackAsync() ;
        };
        return promise.isResolved(function () { conn.release(); });
    });
};

var pool = mysql.createPool({
    host           : process.env.MYSQL_HOST,
    port           : process.env.MYSQL_PORT,
    user           : process.env.MYSQL_USER_NAME,
    password       : process.env.MYSQL_USER_PASSWORD,
    database       : process.env.MYSQL_DEFAULT_SCHEMA,
    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT || 10
});

getConnection = function() {
    return pool.getConnectionAsync().disposer(function(connection) {
        connection.release();
    });
};

var query = function (query, params) {
    console.log('query: ' + query);
    console.log('params: ' + _.flatten(params));
    return using(pool.getConnectionAsync(), function (connection) {
        return connection.queryAsync(query, params).then(function (data) {
            return data;
        });
    });
};



var command = function (query, params) {
    console.log('query: ' + query);
    console.log('params: ' + _.flatten(params));
    return using(pool.getTransaction(), function (connection){
        return connection.queryAsync(query, params).then(function (data) {
           // console.log("data1 :" + JSON.stringify(data));
            return data;
        })
    }).then(function (data) {
        //console.log("data1 :" +  data);
        return data;
    }).catch(function (err) {
        //console.log("error :" +  err);
        return err;
    });
};

var ping = function() {
    return query('select 1');
};


module.exports = {
    ping    : ping,
    query   : query,
    command : command
};