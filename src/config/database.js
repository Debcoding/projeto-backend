'use strict';

/**
 * Configuração do banco por ambiente.
 * É usada tanto pela aplicação quanto pelo sequelize-cli (migrations/seeders),
 * por isso é um módulo CommonJS simples e independente do restante do código.
 *
 * Em "test" usamos SQLite em memória: os testes rodam sem precisar de MySQL.
 */
require('dotenv').config();

// Padrões compartilhados: timestamps nomeados em snake_case (created_at/updated_at).
const define = {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const mysql = {
  dialect: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'store_api',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || null,
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  define,
};

module.exports = {
  development: { ...mysql },
  production: { ...mysql, logging: false },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define,
  },
};
