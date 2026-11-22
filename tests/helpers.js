const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');
const app = require('../src/app');
const env = require('../src/config/env');
const { sequelize } = require('../src/models');

/** Recria todas as tabelas (SQLite em memória) e limpa a pasta de uploads. */
async function resetDatabase() {
  await sequelize.sync({ force: true });
  fs.rmSync(env.uploadDir, { recursive: true, force: true });
}

/** Libera a conexão e remove os arquivos gravados pelos testes. */
async function shutdown() {
  await sequelize.close();
  fs.rmSync(env.uploadDir, { recursive: true, force: true });
}

/** Cadastra um usuário, faz login e devolve o cabeçalho Authorization pronto. */
async function authHeader(overrides = {}) {
  const user = {
    firstname: 'Ana',
    surname: 'Silva',
    email: 'ana@mail.com',
    password: '123@123',
    ...overrides,
  };
  await request(app).post('/v1/user').send({ ...user, confirmPassword: user.password });
  const res = await request(app)
    .post('/v1/user/token')
    .send({ email: user.email, password: user.password });
  return { Authorization: `Bearer ${res.body.token}` };
}

/** Imagem "falsa" em base64: cabeçalho PNG válido + bytes qualquer (basta para a detecção). */
function fakePng(label = 'img') {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from(label),
  ]).toString('base64');
}

/** Caminho absoluto no disco de uma URL /media/... devolvida pela API. */
function filePathFromUrl(url) {
  return path.join(env.uploadDir, url.split('/media/')[1]);
}

module.exports = { app, request, resetDatabase, shutdown, authHeader, fakePng, filePathFromUrl };
