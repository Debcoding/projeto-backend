'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductOption = sequelize.define(
    'ProductOption',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      shape: {
        type: DataTypes.ENUM('square', 'circle'),
        allowNull: false,
        defaultValue: 'square',
      },
      radius: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      type: {
        type: DataTypes.ENUM('text', 'color'),
        allowNull: false,
        defaultValue: 'text',
      },
      // Coluna "values" no banco (valores separados por vírgula). O atributo tem outro
      // nome para não colidir com membros internos do Sequelize.
      option_values: { type: DataTypes.STRING(1000), allowNull: false, field: 'values' },
    },
    { tableName: 'product_options', timestamps: false },
  );

  return ProductOption;
};
