'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
      use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'categories' },
  );

  Category.associate = (models) => {
    Category.belongsToMany(models.Product, {
      through: models.ProductCategory,
      foreignKey: 'category_id',
      otherKey: 'product_id',
      as: 'products',
    });
  };

  return Category;
};
