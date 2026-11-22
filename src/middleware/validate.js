'use strict';

const AppError = require('../utils/AppError');

// Mensagens de validação do Joi em português.
const messages = {
  'any.required': '{{#label}} é obrigatório',
  'any.only': '{{#label}} possui um valor inválido',
  'any.invalid': '{{#label}} possui um valor inválido',
  'string.base': '{{#label}} deve ser um texto',
  'string.empty': '{{#label}} não pode ser vazio',
  'string.email': '{{#label}} deve ser um e-mail válido',
  'string.min': '{{#label}} deve ter no mínimo {{#limit}} caracteres',
  'string.max': '{{#label}} deve ter no máximo {{#limit}} caracteres',
  'string.pattern.base': '{{#label}} possui formato inválido',
  'number.base': '{{#label}} deve ser um número',
  'number.integer': '{{#label}} deve ser um número inteiro',
  'number.min': '{{#label}} deve ser maior ou igual a {{#limit}}',
  'number.positive': '{{#label}} deve ser positivo',
  'boolean.base': '{{#label}} deve ser verdadeiro ou falso',
  'array.base': '{{#label}} deve ser uma lista',
  'array.min': '{{#label}} deve ter ao menos {{#limit}} item(ns)',
  'array.unique': '{{#label}} não pode ter itens repetidos',
  'object.base': '{{#label}} deve ser um objeto',
};

/**
 * Cria um middleware que valida (e converte) req[source] com um schema Joi.
 * O resultado fica em req.valid[source]; nos controllers use SEMPRE req.valid,
 * pois no Express 5 req.query é somente leitura.
 *
 * @param {import('joi').Schema} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const input = req[source] ?? {};
    const { error, value } = schema.validate(input, {
      abortEarly: false,
      stripUnknown: true, // descarta campos desconhecidos
      messages,
    });

    if (error) {
      const details = error.details.map((item) => ({
        field: item.path.join('.'),
        message: item.message,
      }));
      throw new AppError('Dados da requisição inválidos', 400, details);
    }

    req.valid = { ...req.valid, [source]: value };
    next();
  };
}

module.exports = validate;
