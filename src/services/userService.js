'use strict';

const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const env = require('../config/env');
const { User } = require('../models');
const AppError = require('../utils/AppError');

/** Representação pública do usuário (nunca inclui a senha). */
const serialize = (user) => ({
  id: user.id,
  firstname: user.firstname,
  surname: user.surname,
  email: user.email,
});

async function findOrFail(id) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('Usuário não encontrado', 404);
  return user;
}

/** Garante que o e-mail não pertence a outro usuário. */
async function assertEmailAvailable(email, ignoreId = null) {
  const where = { email };
  if (ignoreId) where.id = { [Op.ne]: ignoreId };

  if ((await User.count({ where })) > 0) {
    throw new AppError('Já existe um usuário cadastrado com este e-mail', 400);
  }
}

async function getById(id) {
  return serialize(await findOrFail(id));
}

async function create({ firstname, surname, email, password }) {
  await assertEmailAvailable(email);
  const hash = await bcrypt.hash(password, env.bcryptRounds);
  const user = await User.create({ firstname, surname, email, password: hash });
  return serialize(user);
}

async function update(id, { firstname, surname, email }) {
  const user = await findOrFail(id);
  await assertEmailAvailable(email, id);
  await user.update({ firstname, surname, email });
}

async function remove(id) {
  const user = await findOrFail(id);
  await user.destroy();
}

module.exports = { getById, create, update, remove };
