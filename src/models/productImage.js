'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductImage = sequelize.define(
    'ProductImage',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      // Caminho relativo da imagem dentro da pasta de uploads.
      path: { type: DataTypes.STRING, allowNull: false },
    },
    { tableName: 'product_images', timestamps: false },
  );

  return ProductImage;
};
