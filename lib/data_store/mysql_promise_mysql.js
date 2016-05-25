var mysql = require('promise-mysql');


var type = 'MySql';

var pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER_NAME,
    password: process.env.MYSQL_USER_PASSWORD,
    database: process.env.MYSQL_DEFAULT_SCHEMA,
    connectionLimit: process.env.MYSQL_CONNECTION_LIMIT || 10
});


exports.ping = function() {
    return pool.query('select 1');
};

exports.queryAsync = function(query, params) {
    return pool.queryAsync(query, params);
};







