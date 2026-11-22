'use strict';

const Joi = require('joi');

/** Valida o parâmetro de rota :id. */
const idParams = Joi.object({
  id: Joi.number().integer().positive().required(),
});

/** limit: padrão 12; -1 retorna todos os itens. page: padrão 1. */
const pagination = {
  limit: Joi.number().integer().min(-1).invalid(0).default(12),
  page: Joi.number().integer().min(1).default(1),
};

/** "a,b,c" -> ['a','b','c'], aceitando apenas nomes de campos permitidos. */
const fieldsList = (allowed) =>
  Joi.string().custom((value, helpers) => {
    const list = value.split(',').map((item) => item.trim()).filter(Boolean);
    if (list.length === 0 || list.some((item) => !allowed.includes(item))) {
      return helpers.message(`fields contém campos inválidos. Permitidos: ${allowed.join(', ')}`);
    }
    return [...new Set(list)];
  });

/** "1,15,24" -> [1, 15, 24] */
const integerList = Joi.string().custom((value, helpers) => {
  const list = value.split(',').map((item) => item.trim());
  if (list.some((item) => !/^\d+$/.test(item))) {
    return helpers.message('Deve ser uma lista de números inteiros separados por vírgula');
  }
  return [...new Set(list.map(Number))];
});

module.exports = { idParams, pagination, fieldsList, integerList };
