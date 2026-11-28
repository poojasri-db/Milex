const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: '52.66.31.32',
    user: 'sqlyog_user',
    password: 'mysql@123',
    database: 'Ecom_milex',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;