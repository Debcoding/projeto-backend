'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Valida e-mail/senha e gera um JWT (HS256) cujo "sub" é o id do usuário.
 * Mensagem genérica para não revelar se o e-mail existe.
 */
async function login({ email, password }) {
  // unscoped: o escopo padrão do model esconde a coluna password.
  const user = await User.unscoped().findOne({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.password) : false;

  if (!valid) throw new AppError('E-mail ou senha inválidos', 400);

  const token = jwt.sign({ email: user.email }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  });

  return { token };
}

module.exports = { login };
