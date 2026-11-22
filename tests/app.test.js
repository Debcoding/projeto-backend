const { app, request, resetDatabase, shutdown } = require('./helpers');

beforeAll(resetDatabase);
afterAll(shutdown);

describe('Infraestrutura da API', () => {
  it('GET /health responde 200 com o banco disponível', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('GET /api-docs.json expõe a especificação OpenAPI', async () => {
    const res = await request(app).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.paths['/v1/product/{id}']).toBeDefined();
  });

  it('retorna 404 para rotas inexistentes', async () => {
    const res = await request(app).get('/v1/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.message).toBeDefined();
  });

  it('retorna 400 para JSON malformado', async () => {
    const res = await request(app)
      .post('/v1/user')
      .set('Content-Type', 'application/json')
      .send('{ "firstname": ');
    expect(res.status).toBe(400);
  });
});
