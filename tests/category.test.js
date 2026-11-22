const { app, request, resetDatabase, shutdown, authHeader } = require('./helpers');

let headers;

beforeEach(async () => {
  await resetDatabase();
  headers = await authHeader();
});
afterAll(shutdown);

const create = (data) => request(app).post('/v1/category').set(headers).send(data);

describe('CRUD de categorias', () => {
  it('POST exige token (401) e valida os dados (400)', async () => {
    const noToken = await request(app).post('/v1/category').send({ name: 'A', slug: 'a' });
    expect(noToken.status).toBe(401);
    expect((await create({ name: 'Sem slug' })).status).toBe(400);
  });

  it('cria (201) com use_in_menu padrão false', async () => {
    const res = await create({ name: 'Shoes', slug: 'shoes' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), name: 'Shoes', slug: 'shoes', use_in_menu: false });
  });

  it('GET /:id retorna 200 e 404', async () => {
    const created = await create({ name: 'Shoes', slug: 'shoes', use_in_menu: true });
    const ok = await request(app).get(`/v1/category/${created.body.id}`);
    expect(ok.status).toBe(200);
    expect(ok.body.use_in_menu).toBe(true);
    expect((await request(app).get('/v1/category/999')).status).toBe(404);
  });

  it('PUT atualiza (204), exige token e retorna 404/400', async () => {
    const created = await create({ name: 'Shoes', slug: 'shoes' });
    const url = `/v1/category/${created.body.id}`;
    const data = { name: 'Sneakers', slug: 'sneakers', use_in_menu: true };

    expect((await request(app).put(url).send(data)).status).toBe(401);
    expect((await request(app).put(url).set(headers).send(data)).status).toBe(204);
    expect((await request(app).get(url)).body).toMatchObject(data);
    expect((await request(app).put('/v1/category/999').set(headers).send(data)).status).toBe(404);
    expect((await request(app).put(url).set(headers).send({ name: '' })).status).toBe(400);
  });

  it('DELETE remove (204), exige token e retorna 404', async () => {
    const created = await create({ name: 'Shoes', slug: 'shoes' });
    const url = `/v1/category/${created.body.id}`;

    expect((await request(app).delete(url)).status).toBe(401);
    expect((await request(app).delete(url).set(headers)).status).toBe(204);
    expect((await request(app).delete(url).set(headers)).status).toBe(404);
  });
});

describe('GET /v1/category/search', () => {
  beforeEach(async () => {
    await create({ name: 'Shoes', slug: 'shoes', use_in_menu: true });
    await create({ name: 'Offers', slug: 'offers', use_in_menu: true });
    await create({ name: 'Black Friday', slug: 'black-friday', use_in_menu: false });
  });

  it('usa limit=12 e page=1 por padrão', async () => {
    const res = await request(app).get('/v1/category/search');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 3, limit: 12, page: 1 });
    expect(res.body.data).toHaveLength(3);
  });

  it('pagina os resultados', async () => {
    const res = await request(app).get('/v1/category/search?limit=2&page=2');
    expect(res.body.data).toHaveLength(1);
    expect(res.body).toMatchObject({ total: 3, limit: 2, page: 2 });
  });

  it('limit=-1 retorna todos os itens', async () => {
    const res = await request(app).get('/v1/category/search?limit=-1&page=5');
    expect(res.body.data).toHaveLength(3);
    expect(res.body).toMatchObject({ limit: -1, page: 1 });
  });

  it('filtra por use_in_menu', async () => {
    const res = await request(app).get('/v1/category/search?use_in_menu=true');
    expect(res.body.total).toBe(2);
    expect(res.body.data.every((item) => item.use_in_menu === true)).toBe(true);
  });

  it('limita os campos retornados', async () => {
    const res = await request(app).get('/v1/category/search?fields=name,slug');
    expect(Object.keys(res.body.data[0]).sort()).toEqual(['name', 'slug']);
  });

  it('retorna 400 para parâmetros inválidos', async () => {
    expect((await request(app).get('/v1/category/search?limit=0')).status).toBe(400);
    expect((await request(app).get('/v1/category/search?page=abc')).status).toBe(400);
    expect((await request(app).get('/v1/category/search?fields=senha')).status).toBe(400);
  });
});
