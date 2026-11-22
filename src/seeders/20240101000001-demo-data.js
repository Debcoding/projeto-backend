'use strict';

const bcrypt = require('bcrypt');

const DEMO_EMAIL = 'demo@mail.com';
const CATEGORY_SLUGS = ['shoes', 'offers', 'black-friday'];

/** Dados de demonstração: 1 usuário (demo@mail.com / 123@123) e 3 categorias. */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        firstname: 'Demo',
        surname: 'User',
        email: DEMO_EMAIL,
        password: await bcrypt.hash('123@123', 10),
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('categories', [
      { name: 'Shoes', slug: 'shoes', use_in_menu: true, created_at: now, updated_at: now },
      { name: 'Offers', slug: 'offers', use_in_menu: true, created_at: now, updated_at: now },
      {
        name: 'Black Friday',
        slug: 'black-friday',
        use_in_menu: false,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: DEMO_EMAIL });
    await queryInterface.bulkDelete('categories', { slug: { [Sequelize.Op.in]: CATEGORY_SLUGS } });
  },
};
