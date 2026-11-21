const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'pooja@123',
    database: 'ecom_milex',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;