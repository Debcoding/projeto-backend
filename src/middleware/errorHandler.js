'use strict';

const AppError = require('../utils/AppError');

/**
 * Tratador global de erros (deve ser o último middleware).
 * Converte erros conhecidos em respostas JSON { message, details? } e
 * esconde detalhes internos de erros inesperados (500).
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ message: err.message, ...(err.details && { details: err.details }) });
  }

  // Erros do body-parser (express.json)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido no corpo da requisição' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Corpo da requisição muito grande' });
  }

  // Erros do Sequelize que representam problemas na requisição do cliente
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ message: 'Já existe um registro com os dados informados' });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ message: 'Referência inválida: registro relacionado inexistente' });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Dados da requisição inválidos',
      details: err.errors.map((item) => ({ field: item.path, message: item.message })),
    });
  }

  if (process.env.NODE_ENV !== 'test') console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor' });
}

module.exports = errorHandler;
