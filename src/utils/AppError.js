'use strict';

/**
 * Erro "esperado" da aplicação, com status HTTP associado.
 * O errorHandler converte qualquer AppError em uma resposta JSON.
 */
class AppError extends Error {
  /**
   * @param {string} message mensagem exibida ao cliente
   * @param {number} [statusCode=500] status HTTP
   * @param {Array<{field: string, message: string}>} [details] detalhes de validação
   */
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = AppError;
