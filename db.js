const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'sqlyog_user',
    password: 'pooja@123',
    database: 'ecom_milex_new',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;