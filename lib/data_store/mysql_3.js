const mysql = require('mysql');
const Connection = require('mysql/lib/Connection');
const Pool = require('mysql/lib/Pool');
const Promise = require('bluebird');

Promise.promisifyAll([
    Connection,
    Pool
]);


//const pool = mysql
//    .createPool({
//        host: '127.0.0.1'
//    });

//const getConnection = (pool)  {
//    return pool
//            .getConnectionAsync()
//            .then((connection) => {
//            return connection;
//})
//.disposer((connection) => {
//        return connection.releaseAsync();
//});
//};

