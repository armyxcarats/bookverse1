const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredVars.filter(name => process.env[name] === undefined);
if (missingVars.length) {
    throw new Error(
        `Missing required DB env vars: ${missingVars.join(', ')}. ` +
        'Create a .env file in the project root or set these values in your environment.'
    );
}

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false // Set to console.log to see SQL queries
    }
);

module.exports = sequelize;