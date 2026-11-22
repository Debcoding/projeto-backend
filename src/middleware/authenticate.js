'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Exige o cabeçalho "Authorization: Bearer <jwt>".
 * Em caso de sucesso, disponibiliza { id, email } do usuário em req.user.
 */
function authenticate(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    throw new AppError('Token de autorização não informado', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    throw new AppError('Token de autorização inválido ou expirado', 401);
  }

  req.user = { id: Number(payload.sub), email: payload.email };
  next();
}

module.exports = authenticate;
