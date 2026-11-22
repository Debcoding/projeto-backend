'use strict';

const Joi = require('joi');

const name = Joi.string().trim().max(255);
const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(255);

/** POST /v1/user */
const create = Joi.object({
  firstname: name.required(),
  surname: name.required(),
  email: email.required(),
  // bcrypt só considera os primeiros 72 bytes da senha
  password: Joi.string().min(6).max(72).required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'confirmPassword deve ser igual a password' }),
});

/** PUT /v1/user/:id */
const update = Joi.object({
  firstname: name.required(),
  surname: name.required(),
  email: email.required(),
});

/** POST /v1/user/token */
const login = Joi.object({
  email: email.required(),
  password: Joi.string().required(),
});

module.exports = { create, update, login };
