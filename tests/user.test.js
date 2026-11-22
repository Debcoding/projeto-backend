const bcrypt = require('bcrypt');
const { app, request, resetDatabase, shutdown, authHeader } = require('./helpers');
const { User } = require('../src/models');

const payload = {
  firstname: 'Maria',
  surname: 'Souza',
  email: 'maria@mail.com',
  password: '123@123',
  confirmPassword: '123@123',
};

beforeEach(resetDatabase);
afterAll(shutdown);

describe('POST /v1/user', () => {
  it('cria o usuário (201) sem expor a senha e grava o hash bcrypt', async () => {
    const res = await request(app).post('/v1/user').send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(Number),
      firstname: 'Maria',
      surname: 'Souza',
      email: 'maria@mail.com',
    });

    const stored = await User.unscoped().findOne({ where: { email: payload.email } });
    expect(stored.password).not.toBe(payload.password);
    expect(await bcrypt.compare(payload.password, stored.password)).toBe(true);
  });

  it('retorna 400 quando as senhas não coincidem', async () => {
    const res = await request(app)
      .post('/v1/user')
      .send({ ...payload, confirmPassword: 'outra-senha' });
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('confirmPassword');
  });

  it('retorna 400 para campos obrigatórios ausentes e e-mail inválido', async () => {
    const res = await request(app).post('/v1/user').send({ email: 'invalido' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(1);
  });

  it('retorna 400 para e-mail já cadastrado', async () => {
    await request(app).post('/v1/user').send(payload);
    const res = await request(app).post('/v1/user').send(payload);
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/user/:id', () => {
  it('retorna 200 com os dados públicos do usuário', async () => {
    const created = await request(app).post('/v1/user').send(payload);
    const res = await request(app).get(`/v1/user/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
    expect(res.body.password).toBeUndefined();
  });

  it('retorna 404 quando o usuário não existe', async () => {
    expect((await request(app).get('/v1/user/999')).status).toBe(404);
  });

  it('retorna 400 para id inválido', async () => {
    expect((await request(app).get('/v1/user/abc')).status).toBe(400);
  });
});

describe('POST /v1/user/token', () => {
  beforeEach(() => request(app).post('/v1/user').send(payload));

  it('gera o token JWT com credenciais corretas', async () => {
    const res = await request(app)
      .post('/v1/user/token')
      .send({ email: payload.email, password: payload.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('retorna 400 com senha incorreta', async () => {
    const res = await request(app)
      .post('/v1/user/token')
      .send({ email: payload.email, password: 'errada' });
    expect(res.status).toBe(400);
  });

  it('retorna 400 com usuário inexistente ou corpo incompleto', async () => {
    const unknown = await request(app)
      .post('/v1/user/token')
      .send({ email: 'x@mail.com', password: '123@123' });
    expect(unknown.status).toBe(400);
    expect((await request(app).post('/v1/user/token').send({})).status).toBe(400);
  });
});

describe('PUT /v1/user/:id', () => {
  const update = { firstname: 'Mariana', surname: 'Lima', email: 'mariana@mail.com' };

  it('retorna 401 sem token ou com token inválido', async () => {
    const created = await request(app).post('/v1/user').send(payload);
    const noToken = await request(app).put(`/v1/user/${created.body.id}`).send(update);
    const badToken = await request(app)
      .put(`/v1/user/${created.body.id}`)
      .set('Authorization', 'Bearer token-invalido')
      .send(update);
    expect(noToken.status).toBe(401);
    expect(badToken.status).toBe(401);
  });

  it('atualiza o usuário (204) e persiste as alterações', async () => {
    const headers = await authHeader();
    const created = await request(app).post('/v1/user').send(payload);

    const res = await request(app).put(`/v1/user/${created.body.id}`).set(headers).send(update);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const found = await request(app).get(`/v1/user/${created.body.id}`);
    expect(found.body).toMatchObject(update);
  });

  it('retorna 400 para dados inválidos e para e-mail de outro usuário', async () => {
    const headers = await authHeader();
    const created = await request(app).post('/v1/user').send(payload);

    const invalid = await request(app)
      .put(`/v1/user/${created.body.id}`)
      .set(headers)
      .send({ firstname: 'x' });
    expect(invalid.status).toBe(400);

    const duplicated = await request(app)
      .put(`/v1/user/${created.body.id}`)
      .set(headers)
      .send({ ...update, email: 'ana@mail.com' }); // e-mail do usuário autenticado
    expect(duplicated.status).toBe(400);
  });

  it('retorna 404 quando o usuário não existe', async () => {
    const headers = await authHeader();
    const res = await request(app).put('/v1/user/999').set(headers).send(update);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /v1/user/:id', () => {
  it('retorna 401 sem token', async () => {
    expect((await request(app).delete('/v1/user/1')).status).toBe(401);
  });

  it('remove o usuário (204) e depois retorna 404', async () => {
    const headers = await authHeader();
    const created = await request(app).post('/v1/user').send(payload);

    expect((await request(app).delete(`/v1/user/${created.body.id}`).set(headers)).status).toBe(204);
    expect((await request(app).get(`/v1/user/${created.body.id}`)).status).toBe(404);
    expect((await request(app).delete(`/v1/user/${created.body.id}`).set(headers)).status).toBe(404);
  });
});
