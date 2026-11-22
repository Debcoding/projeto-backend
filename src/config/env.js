'use strict';

/**
 * Variáveis de ambiente da aplicação, lidas uma única vez e congeladas.
 * Falha cedo (fail fast) se algo essencial estiver faltando.
 */
const path = require('node:path');

require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('A variável de ambiente JWT_SECRET é obrigatória (veja o .env.example).');
}

const port = Number(process.env.PORT) || 3000;

module.exports = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port,
  appUrl: (process.env.APP_URL || `http://localhost:${port}`).replace(/\/$/, ''),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  uploadDir: path.resolve(process.env.UPLOAD_DIR || 'uploads'),
});
