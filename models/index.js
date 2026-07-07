const sequelize = require('../config/database');
const Item = require('./item');
const Stock = require('./stock');
const ItemImage = require('./itemImage');
const User = require('./user');
const Customer = require('./customer');

// Initialize models
const db = {};
db.Item = Item(sequelize, require('sequelize').DataTypes);
db.Stock = Stock(sequelize, require('sequelize').DataTypes);
db.ItemImage = ItemImage(sequelize, require('sequelize').DataTypes);
db.User = User(sequelize, require('sequelize').DataTypes);
db.Customer = Customer(sequelize, require('sequelize').DataTypes);

// Define associations
db.Item.hasOne(db.Stock, {
    foreignKey: 'item_id',
    onDelete: 'CASCADE'
});
db.Stock.belongsTo(db.Item, {
    foreignKey: 'item_id'
});

db.Item.hasMany(db.ItemImage, {
    foreignKey: 'item_id',
    onDelete: 'CASCADE'
});
db.ItemImage.belongsTo(db.Item, {
    foreignKey: 'item_id'
});

db.User.hasOne(db.Customer, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
});
db.Customer.belongsTo(db.User, {
    foreignKey: 'user_id'
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;