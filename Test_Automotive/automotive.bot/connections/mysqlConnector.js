const mysql = require('mysql');
const GLOBAL = require('../GLOBAL_VARS.json');

// Create the connection pool
const pool = mysql.createPool({
    connectionLimit: GLOBAL.MYSQL.CONNECTION_LIMIT,
    host: GLOBAL.MYSQL.HOST,
    user: GLOBAL.MYSQL.USERNAME,
    password: GLOBAL.MYSQL.PASSWORD,
    database: GLOBAL.MYSQL.SCHEMA
});

// Function to execute a query
exports.executeQuery = function (query, params, callback) {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting MySQL connection from pool:', err);
            callback(err, null);
            return;
        }

        connection.query(query, params, (error, results, fields) => {
            // Release the connection back to the pool
            connection.release();

            if (error) {
                console.error('Error executing query:', error);
                callback(error, null);
                return;
            }

            callback(null, results);
        });
    });
}


// Handling errors on the pool
pool.on('error', (err) => {
    console.error('MySQL pool error:', err);
});
