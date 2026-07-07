const path = require('path');
const mysql = require('mysql2');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredVars.filter(name => process.env[name] === undefined);
if (missingVars.length) {
    throw new Error(
        `Missing required DB env vars: ${missingVars.join(', ')}. ` +
        'Create a .env file in the project root or set these values in your environment.'
    );
}

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
});

module.exports = connection;