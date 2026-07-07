module.exports = (sequelize, DataTypes) => {
    const Item = sequelize.define('Item', {
        item_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'title'
        },
        description_text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        genre: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        cost_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        sell_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        on_sale: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        sale_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        img_path: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'item',
        timestamps: true,
        underscored: true
    });
    return Item;
};