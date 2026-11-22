const fs = require('node:fs');
const {
  app,
  request,
  resetDatabase,
  shutdown,
  authHeader,
  fakePng,
  filePathFromUrl,
} = require('./helpers');

let headers;
let categoryIds;

const createCategory = async (name, slug) =>
  (await request(app).post('/v1/category').set(headers).send({ name, slug })).body.id;

const basePayload = (overrides = {}) => ({
  enabled: true,
  name: 'Tênis Runner',
  slug: 'tenis-runner',
  stock: 10,
  description: 'Tênis leve para corrida',
  price: 119.9,
  price_with_discount: 99.9,
  category_ids: categoryIds,
  images: [{ type: 'image/png', content: fakePng('1') }, { content: fakePng('2') }],
  options: [{ title: 'Tamanho', shape: 'square', radius: '4px', type: 'text', values: ['PP', 'M', 'GG'] }],
  ...overrides,
});

const createProduct = (overrides) =>
  request(app).post('/v1/product').set(headers).send(basePayload(overrides));

beforeEach(async () => {
  await resetDatabase();
  headers = await authHeader();
  categoryIds = [await createCategory('Shoes', 'shoes'), await createCategory('Offers', 'offers')];
});
afterAll(shutdown);

describe('POST /v1/product', () => {
  it('exige token (401)', async () => {
    const res = await request(app).post('/v1/product').send(basePayload());
    expect(res.status).toBe(401);
  });

  it('cria produto com categorias, imagens e opções (201)', async () => {
    const res = await createProduct();

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      enabled: true,
      name: 'Tênis Runner',
      slug: 'tenis-runner',
      stock: 10,
      price: 119.9,
      price_with_discount: 99.9,
      category_ids: categoryIds,
    });
    expect(res.body.images).toHaveLength(2);
    expect(res.body.images[0].content).toMatch(/^http:\/\/localhost:3000\/media\/products\/.+\.png$/);
    expect(res.body.options).toEqual([
      expect.objectContaining({ title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: ['PP', 'M', 'GG'] }),
    ]);

    // o arquivo foi realmente gravado e é servido em /media
    expect(fs.existsSync(filePathFromUrl(res.body.images[0].content))).toBe(true);
    const media = await request(app).get(new URL(res.body.images[0].content).pathname);
    expect(media.status).toBe(200);
  });

  it('aplica os valores padrão (enabled=false, stock=0, sem relações)', async () => {
    const res = await request(app)
      .post('/v1/product')
      .set(headers)
      .send({ name: 'Simples', slug: 'simples', price: 10, price_with_discount: 8 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ enabled: false, stock: 0, category_ids: [], images: [], options: [] });
  });

  it('retorna 400 para dados inválidos', async () => {
    const missing = await request(app).post('/v1/product').set(headers).send({ name: 'x' });
    expect(missing.status).toBe(400);

    expect((await createProduct({ price: -5 })).status).toBe(400);
    expect((await createProduct({ images: [{ type: 'image/png' }] })).status).toBe(400);
    expect((await createProduct({ options: [{ title: 'Sem valores' }] })).status).toBe(400);
  });

  it('retorna 400 para categoria inexistente e não deixa registros nem arquivos', async () => {
    const res = await createProduct({ category_ids: [999] });
    expect(res.status).toBe(400);
    expect((await request(app).get('/v1/product/search')).body.total).toBe(0);
  });

  it('retorna 400 para imagem que não é PNG/JPEG/GIF/WEBP', async () => {
    const res = await createProduct({
      images: [{ type: 'image/png', content: Buffer.from('texto qualquer').toString('base64') }],
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/product/:id', () => {
  it('retorna 200 com o produto completo e 404 quando não existe', async () => {
    const created = await createProduct();
    const ok = await request(app).get(`/v1/product/${created.body.id}`);

    expect(ok.status).toBe(200);
    expect(ok.body).toEqual(created.body);
    expect((await request(app).get('/v1/product/999')).status).toBe(404);
    expect((await request(app).get('/v1/product/abc')).status).toBe(400);
  });
});

describe('GET /v1/product/search', () => {
  beforeEach(async () => {
    await createProduct({ name: 'Tênis Runner', slug: 'runner', price: 150, category_ids: [categoryIds[0]] });
    await createProduct({
      name: 'Camiseta Básica',
      slug: 'camiseta',
      description: 'Algodão confortável',
      price: 50,
      category_ids: [categoryIds[1]],
      images: [],
      options: [{ title: 'Cor', type: 'color', shape: 'circle', values: ['#000', '#fff'] }],
    });
    await createProduct({ name: 'Bota', slug: 'bota', description: 'Calçado resistente', price: 300, category_ids: categoryIds, images: [], options: [] });
  });

  it('usa paginação padrão e informa o total', async () => {
    const res = await request(app).get('/v1/product/search');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 3, limit: 12, page: 1 });
    expect(res.body.data).toHaveLength(3);
  });

  it('pagina e aceita limit=-1', async () => {
    const paged = await request(app).get('/v1/product/search?limit=2&page=2');
    expect(paged.body.data.map((p) => p.name)).toEqual(['Bota']);
    expect(paged.body.total).toBe(3);

    const all = await request(app).get('/v1/product/search?limit=-1');
    expect(all.body.data).toHaveLength(3);
  });

  it('filtra por match em nome ou descrição', async () => {
    const byName = await request(app).get(`/v1/product/search?match=${encodeURIComponent('Tênis')}`);
    expect(byName.body.data.map((p) => p.name)).toEqual(['Tênis Runner']);

    const byDescription = await request(app).get(`/v1/product/search?match=${encodeURIComponent('Algodão')}`);
    expect(byDescription.body.data.map((p) => p.name)).toEqual(['Camiseta Básica']);
  });

  it('filtra por category_ids', async () => {
    const res = await request(app).get(`/v1/product/search?category_ids=${categoryIds[1]}`);
    expect(res.body.data.map((p) => p.name).sort()).toEqual(['Bota', 'Camiseta Básica']);
    expect(res.body.total).toBe(2);
  });

  it('filtra por price-range', async () => {
    const res = await request(app).get('/v1/product/search?price-range=100-200');
    expect(res.body.data.map((p) => p.name)).toEqual(['Tênis Runner']);
  });

  it('filtra por option[id]', async () => {
    const all = await request(app).get('/v1/product/search?limit=-1');
    const shirt = all.body.data.find((p) => p.name === 'Camiseta Básica');
    const optionId = shirt.options[0].id;

    const hit = await request(app).get(`/v1/product/search?option%5B${optionId}%5D=${encodeURIComponent('#fff,#123')}`);
    expect(hit.body.data.map((p) => p.name)).toEqual(['Camiseta Básica']);

    const miss = await request(app).get(`/v1/product/search?option%5B${optionId}%5D=XG`);
    expect(miss.body).toMatchObject({ data: [], total: 0 });
  });

  it('combina filtros', async () => {
    const res = await request(app).get(
      `/v1/product/search?category_ids=${categoryIds[1]}&price-range=100-400`,
    );
    expect(res.body.data.map((p) => p.name)).toEqual(['Bota']);
  });

  it('limita os campos retornados (inclusive relações)', async () => {
    const res = await request(app).get('/v1/product/search?fields=name,images,price&limit=1');
    expect(Object.keys(res.body.data[0])).toEqual(['name', 'images', 'price']);
    expect(res.body.data[0].images).toHaveLength(2);
  });

  it('retorna 400 para parâmetros inválidos', async () => {
    expect((await request(app).get('/v1/product/search?price-range=abc')).status).toBe(400);
    expect((await request(app).get('/v1/product/search?price-range=200-100')).status).toBe(400);
    expect((await request(app).get('/v1/product/search?category_ids=a,b')).status).toBe(400);
    expect((await request(app).get('/v1/product/search?fields=senha')).status).toBe(400);
    expect((await request(app).get('/v1/product/search?limit=0')).status).toBe(400);
  });
});

describe('PUT /v1/product/:id', () => {
  it('exige token (401) e retorna 404 para produto inexistente', async () => {
    const created = await createProduct();
    expect((await request(app).put(`/v1/product/${created.body.id}`).send({ name: 'x' })).status).toBe(401);
    expect((await request(app).put('/v1/product/999').set(headers).send({ name: 'x' })).status).toBe(404);
  });

  it('atualiza campos escalares e categorias (204), mantendo o que foi omitido', async () => {
    const created = await createProduct();
    const res = await request(app)
      .put(`/v1/product/${created.body.id}`)
      .set(headers)
      .send({ name: 'Atualizado', stock: 20, price: 49.9, price_with_discount: 0, category_ids: [categoryIds[0]] });
    expect(res.status).toBe(204);

    const found = (await request(app).get(`/v1/product/${created.body.id}`)).body;
    expect(found).toMatchObject({
      name: 'Atualizado',
      slug: 'tenis-runner',
      stock: 20,
      price: 49.9,
      price_with_discount: 0,
      category_ids: [categoryIds[0]],
    });
    expect(found.images).toHaveLength(2);
  });

  it('gerencia imagens: remove, mantém (URL), substitui (base64) e cria', async () => {
    const created = await createProduct();
    const [first, second] = created.body.images;
    const firstFile = filePathFromUrl(first.content);
    const secondFile = filePathFromUrl(second.content);

    const res = await request(app)
      .put(`/v1/product/${created.body.id}`)
      .set(headers)
      .send({
        images: [
          { id: first.id, content: first.content }, // mantém
          { id: second.id, content: fakePng('novo') }, // substitui
          { content: fakePng('extra') }, // cria
        ],
      });
    expect(res.status).toBe(204);

    const found = (await request(app).get(`/v1/product/${created.body.id}`)).body;
    expect(found.images).toHaveLength(3);
    expect(fs.existsSync(firstFile)).toBe(true);
    expect(fs.existsSync(secondFile)).toBe(false); // arquivo antigo removido

    const removal = await request(app)
      .put(`/v1/product/${created.body.id}`)
      .set(headers)
      .send({ images: [{ id: first.id, deleted: true }] });
    expect(removal.status).toBe(204);
    expect(fs.existsSync(firstFile)).toBe(false);
    expect((await request(app).get(`/v1/product/${created.body.id}`)).body.images).toHaveLength(2);
  });

  it('retorna 400 para imagem ou opção que não pertence ao produto', async () => {
    const created = await createProduct();
    const badImage = await request(app)
      .put(`/v1/product/${created.body.id}`)
      .set(headers)
      .send({ images: [{ id: 999, deleted: true }] });
    const badOption = await request(app)
      .put(`/v1/product/${created.body.id}`)
      .set(headers)
      .send({ options: [{ id: 999, deleted: true }] });
    expect(badImage.status).toBe(400);
    expect(badOption.status).toBe(400);
  });

  it('gerencia opções: altera parcialmente, remove e cria', async () => {
    const created = await createProduct();
    const optionId = created.body.options[0].id;

    const res = await request(app)
      .put(`/v1/product/${created.body.id}`)
      .set(headers)
      .send({
        options: [
          { id: optionId, radius: '10px', value: ['42/43', '44/45'] },
          { title: 'Tipo', shape: 'circle', type: 'text', values: ['100% algodão'] },
        ],
      });
    expect(res.status).toBe(204);

    const { options } = (await request(app).get(`/v1/product/${created.body.id}`)).body;
    expect(options).toHaveLength(2);
    expect(options[0]).toMatchObject({ id: optionId, title: 'Tamanho', radius: 10, values: ['42/43', '44/45'] });
    expect(options[1]).toMatchObject({ title: 'Tipo', shape: 'circle', values: ['100% algodão'] });

    await request(app)
      .put(`/v1/product/${created.body.id}`)
      .set(headers)
      .send({ options: [{ id: optionId, deleted: true }] });
    expect((await request(app).get(`/v1/product/${created.body.id}`)).body.options).toHaveLength(1);
  });

  it('retorna 400 para dados inválidos e para categoria inexistente (sem alterar nada)', async () => {
    const created = await createProduct();
    const url = `/v1/product/${created.body.id}`;

    expect((await request(app).put(url).set(headers).send({ price: 'caro' })).status).toBe(400);
    expect((await request(app).put(url).set(headers).send({ name: 'Novo', category_ids: [999] })).status).toBe(400);
    expect((await request(app).get(url)).body.name).toBe('Tênis Runner'); // transação revertida
  });
});

describe('DELETE /v1/product/:id', () => {
  it('exige token (401) e retorna 404 quando não existe', async () => {
    expect((await request(app).delete('/v1/product/1')).status).toBe(401);
    expect((await request(app).delete('/v1/product/999').set(headers)).status).toBe(404);
  });

  it('remove o produto, suas relações e os arquivos de imagem (204)', async () => {
    const created = await createProduct();
    const files = created.body.images.map((image) => filePathFromUrl(image.content));

    const res = await request(app).delete(`/v1/product/${created.body.id}`).set(headers);
    expect(res.status).toBe(204);
    expect((await request(app).get(`/v1/product/${created.body.id}`)).status).toBe(404);
    files.forEach((file) => expect(fs.existsSync(file)).toBe(false));

    // a categoria continua existindo
    expect((await request(app).get(`/v1/category/${categoryIds[0]}`)).status).toBe(200);
  });

  it('apagar uma categoria não apaga o produto, apenas o vínculo', async () => {
    const created = await createProduct();
    await request(app).delete(`/v1/category/${categoryIds[0]}`).set(headers);

    const found = await request(app).get(`/v1/product/${created.body.id}`);
    expect(found.status).toBe(200);
    expect(found.body.category_ids).toEqual([categoryIds[1]]);
  });
});
