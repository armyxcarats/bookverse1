module.exports = (sequelize, DataTypes) => {
    const Stock = sequelize.define('Stock', {
        // stock_id: {
        //     type: DataTypes.INTEGER,
        //     primaryKey: true,
        //     autoIncrement: true
        // },
        item_id: {
            primaryKey: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'item',
                key: 'item_id'
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'stock',
        timestamps: false
    });

    return Stock;
};