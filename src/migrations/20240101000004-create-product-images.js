'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_images', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      product_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      enabled: { allowNull: false, defaultValue: false, type: Sequelize.BOOLEAN },
      path: { allowNull: false, type: Sequelize.STRING },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_images');
  },
};
