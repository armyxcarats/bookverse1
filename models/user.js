module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        role: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'user'
        },
        token: {
            type: DataTypes.STRING(512),
            allowNull: true,
            defaultValue: null
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        underscored: true
    });

    return User;
};