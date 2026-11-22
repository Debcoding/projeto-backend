'use strict';

/**
 * Cria a conexão Sequelize, registra os models e monta as associações.
 */
const { Sequelize, DataTypes } = require('sequelize');
const env = require('../config/env');
const databaseConfig = require('../config/database');

const config = databaseConfig[env.nodeEnv];
if (!config) {
  throw new Error(`Sem configuração de banco para NODE_ENV="${env.nodeEnv}".`);
}

const sequelize = new Sequelize(config);

const models = {
  User: require('./user')(sequelize, DataTypes),
  Category: require('./category')(sequelize, DataTypes),
  Product: require('./product')(sequelize, DataTypes),
  ProductImage: require('./productImage')(sequelize, DataTypes),
  ProductOption: require('./productOption')(sequelize, DataTypes),
  ProductCategory: require('./productCategory')(sequelize, DataTypes),
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') model.associate(models);
});

module.exports = { sequelize, Sequelize, ...models };
