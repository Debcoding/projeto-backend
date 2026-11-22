'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
      use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      description: { type: DataTypes.STRING },
      price: { type: DataTypes.FLOAT, allowNull: false },
      price_with_discount: { type: DataTypes.FLOAT, allowNull: false },
    },
    { tableName: 'products' },
  );

  Product.associate = (models) => {
    // As FKs usam ON DELETE CASCADE: apagar o produto apaga imagens, opções e vínculos.
    Product.hasMany(models.ProductImage, {
      foreignKey: 'product_id',
      as: 'images',
      onDelete: 'CASCADE',
    });
    Product.hasMany(models.ProductOption, {
      foreignKey: 'product_id',
      as: 'options',
      onDelete: 'CASCADE',
    });
    Product.belongsToMany(models.Category, {
      through: models.ProductCategory,
      foreignKey: 'product_id',
      otherKey: 'category_id',
      as: 'categories',
    });
  };

  return Product;
};
