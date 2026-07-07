module.exports = (sequelize, DataTypes) => {
    const Customer = sequelize.define('Customer', {
        customer_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        fname: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        lname: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        addressline: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        zipcode: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        image_path: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'customer',
        timestamps: false
    });

    return Customer;
};