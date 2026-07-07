module.exports = (sequelize, DataTypes) => {
    const ItemImage = sequelize.define('ItemImage', {
        item_image_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        item_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'item',
                key: 'item_id'
            }
        },
        file_path: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'item_image',
        timestamps: false,
        underscored: true
    });

    return ItemImage;
};
