'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_options', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      product_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      title: { allowNull: false, type: Sequelize.STRING },
      shape: {
        allowNull: false,
        defaultValue: 'square',
        type: Sequelize.ENUM('square', 'circle'),
      },
      radius: { allowNull: false, defaultValue: 0, type: Sequelize.INTEGER },
      type: {
        allowNull: false,
        defaultValue: 'text',
        type: Sequelize.ENUM('text', 'color'),
      },
      values: { allowNull: false, type: Sequelize.STRING(1000) },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_options');
  },
};
