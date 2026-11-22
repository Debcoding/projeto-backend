'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      enabled: { allowNull: false, defaultValue: false, type: Sequelize.BOOLEAN },
      name: { allowNull: false, type: Sequelize.STRING },
      slug: { allowNull: false, type: Sequelize.STRING },
      use_in_menu: { allowNull: false, defaultValue: false, type: Sequelize.BOOLEAN },
      stock: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
      description: { type: Sequelize.STRING },
      price: { allowNull: false, type: Sequelize.FLOAT },
      price_with_discount: { allowNull: false, type: Sequelize.FLOAT },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
    });

    // Acelera o filtro por faixa de preço (price-range) da busca de produtos.
    await queryInterface.addIndex('products', ['price'], { name: 'products_price_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
