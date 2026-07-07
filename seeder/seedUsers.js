require('dotenv').config();
const db = require('../models');
const bcrypt = require('bcrypt');

const users = [
  {
    name: 'Admin User',
    email: 'admin@bookverse.local',
    password: 'Admin123!',
    role: 'admin',
    customer: {
      fname: 'Admin',
      lname: 'User'
    }
  },
  {
    name: 'Juan Dela Cruz',
    email: 'juan@bookverse.local',
    password: 'User123!',
    role: 'user',
    customer: {
      fname: 'Juan',
      lname: 'Dela Cruz',
      addressline: 'Manila City',
      zipcode: '1000',
      phone: '09171234567'
    }
  }
];

async function seedUsers() {
  try {
    await db.sequelize.authenticate();
    console.log('DB connection OK');

    for (const userData of users) {
      let user = await db.User.findOne({ where: { email: userData.email } });
      if (!user) {
        const hashed = await bcrypt.hash(userData.password, 10);
        user = await db.User.create({ name: userData.name, email: userData.email, password: hashed, role: userData.role });
        console.log(`Created user: ${userData.email}`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }

      const customer = await db.Customer.findOne({ where: { user_id: user.id } });
      if (!customer) {
        await db.Customer.create({ user_id: user.id, fname: userData.customer.fname, lname: userData.customer.lname });
        console.log(`Created customer row for: ${userData.email}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed users:', error);
    process.exit(1);
  }
}

seedUsers();
