'use strict';

const AppError = require('../utils/AppError');

/** Qualquer rota não tratada anteriormente responde 404. */
function notFound(req, _res, next) {
  next(new AppError(`Rota não encontrada: ${req.method} ${req.originalUrl}`, 404));
}

module.exports = notFound;
