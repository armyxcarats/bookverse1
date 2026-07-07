require('dotenv').config();
const db = require('../models');

async function seedDatabase() {
  try {
    await db.sequelize.authenticate();
    console.log('DB connection OK');

    await db.sequelize.sync({ alter: true });
    console.log('Database synced.');

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
