
const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: '13.201.189.165',
    user: 'sqlyog_user',
    password: 'sqluser@123',
    database: 'Ecom_milex',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;