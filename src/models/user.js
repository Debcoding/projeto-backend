'use strict';

/** Usuário da API. A senha é armazenada apenas como hash bcrypt. */
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      firstname: { type: DataTypes.STRING, allowNull: false },
      surname: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: 'users',
      // Por padrão o hash da senha nunca é carregado; o login usa User.unscoped().
      defaultScope: { attributes: { exclude: ['password'] } },
    },
  );

  return User;
};
