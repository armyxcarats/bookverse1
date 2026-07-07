require('dotenv').config();
const db = require('../models');

async function rollback() {
  try {
    await db.sequelize.authenticate();
    console.log('DB connection OK');

    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.sequelize.getQueryInterface().dropAllTables();
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    await db.sequelize.sync({ force: true });
    console.log('Database tables reset. All seeded data removed.');

    process.exit(0);
  } catch (error) {
    console.error('Failed to rollback database:', error);
    process.exit(1);
  }
}

rollback();
