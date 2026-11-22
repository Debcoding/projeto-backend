'use strict';

/**
 * Especificação OpenAPI 3.0 da API (exibida em /api-docs pelo Swagger UI).
 * Mantida em JS para reaproveitar trechos repetidos.
 */
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const jsonBody = (schema, required = true) => ({
  required,
  content: { 'application/json': { schema } },
});
const jsonResponse = (description, schema) => ({
  description,
  content: { 'application/json': { schema } },
});

const responses = {
  noContent: { description: 'Sucesso, sem corpo na resposta' },
  badRequest: jsonResponse('Dados da requisição incorretos', ref('Error')),
  unauthorized: jsonResponse('Token de autorização não enviado ou incorreto', ref('Error')),
  notFound: jsonResponse('Recurso solicitado não existe', ref('Error')),
};

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
};
const secured = [{ bearerAuth: [] }];

const paginationParams = (defaultLimit = 12) => [
  {
    name: 'limit',
    in: 'query',
    description: 'Itens por página. Use -1 para buscar todos (page é ignorado).',
    schema: { type: 'integer', minimum: -1, default: defaultLimit },
  },
  {
    name: 'page',
    in: 'query',
    description: 'Página (começa em 1).',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
];

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Store API',
    version: '1.0.0',
    description:
      'API REST para gerenciamento de usuários, categorias e produtos.\n\n' +
      'Rotas POST, PUT e DELETE exigem `Authorization: Bearer <jwt>` ' +
      '(exceto `POST /v1/user` e `POST /v1/user/token`). ' +
      'Gere o token em **POST /v1/user/token** e clique em **Authorize**.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Health', description: 'Verificação de saúde' },
    { name: 'Users', description: 'Usuários e autenticação' },
    { name: 'Categories', description: 'Categorias' },
    { name: 'Products', description: 'Produtos, imagens e opções' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Dados da requisição inválidos' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: { field: { type: 'string' }, message: { type: 'string' } },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          firstname: { type: 'string', example: 'Ana' },
          surname: { type: 'string', example: 'Silva' },
          email: { type: 'string', format: 'email', example: 'ana@mail.com' },
        },
      },
      UserCreate: {
        type: 'object',
        required: ['firstname', 'surname', 'email', 'password', 'confirmPassword'],
        properties: {
          firstname: { type: 'string', example: 'Ana' },
          surname: { type: 'string', example: 'Silva' },
          email: { type: 'string', format: 'email', example: 'ana@mail.com' },
          password: { type: 'string', minLength: 6, maxLength: 72, example: '123@123' },
          confirmPassword: { type: 'string', example: '123@123' },
        },
      },
      UserUpdate: {
        type: 'object',
        required: ['firstname', 'surname', 'email'],
        properties: {
          firstname: { type: 'string', example: 'Ana' },
          surname: { type: 'string', example: 'Souza' },
          email: { type: 'string', format: 'email', example: 'ana@mail.com' },
        },
      },
      Login: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'demo@mail.com' },
          password: { type: 'string', example: '123@123' },
        },
      },
      Token: {
        type: 'object',
        properties: { token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...' } },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Shoes' },
          slug: { type: 'string', example: 'shoes' },
          use_in_menu: { type: 'boolean', example: true },
        },
      },
      CategoryInput: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string', example: 'Shoes' },
          slug: { type: 'string', example: 'shoes' },
          use_in_menu: { type: 'boolean', default: false },
        },
      },
      CategoryList: {
        type: 'object',
        properties: {
          data: { type: 'array', items: ref('Category') },
          total: { type: 'integer', example: 10 },
          limit: { type: 'integer', example: 12 },
          page: { type: 'integer', example: 1 },
        },
      },
      ProductImage: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          content: { type: 'string', example: 'http://localhost:3000/media/products/abc.png' },
        },
      },
      ProductOption: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Tamanho' },
          shape: { type: 'string', enum: ['square', 'circle'], example: 'square' },
          radius: { type: 'integer', example: 4 },
          type: { type: 'string', enum: ['text', 'color'], example: 'text' },
          values: { type: 'array', items: { type: 'string' }, example: ['PP', 'M', 'GG'] },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          enabled: { type: 'boolean', example: true },
          name: { type: 'string', example: 'Produto 01' },
          slug: { type: 'string', example: 'produto-01' },
          use_in_menu: { type: 'boolean', example: false },
          stock: { type: 'integer', example: 10 },
          description: { type: 'string', example: 'Descrição do produto 01' },
          price: { type: 'number', example: 119.9 },
          price_with_discount: { type: 'number', example: 99.9 },
          category_ids: { type: 'array', items: { type: 'integer' }, example: [1, 2] },
          images: { type: 'array', items: ref('ProductImage') },
          options: { type: 'array', items: ref('ProductOption') },
        },
      },
      ProductList: {
        type: 'object',
        properties: {
          data: { type: 'array', items: ref('Product') },
          total: { type: 'integer', example: 120 },
          limit: { type: 'integer', example: 12 },
          page: { type: 'integer', example: 1 },
        },
      },
      ProductImageInput: {
        type: 'object',
        description:
          'Criação: informe content (base64 PNG/JPEG/GIF/WEBP). ' +
          'Atualização: sem id = nova imagem; {id, deleted: true} = remove; ' +
          '{id, content: base64} = substitui; {id, content: URL} = mantém.',
        properties: {
          id: { type: 'integer' },
          type: { type: 'string', example: 'image/png' },
          content: { type: 'string', description: 'Imagem em base64' },
          deleted: { type: 'boolean' },
        },
      },
      ProductOptionInput: {
        type: 'object',
        description:
          'Criação: title e values obrigatórios. Atualização: com id altera parcialmente; ' +
          '{id, deleted: true} remove; sem id cria.',
        properties: {
          id: { type: 'integer' },
          deleted: { type: 'boolean' },
          title: { type: 'string', example: 'Tamanho' },
          shape: { type: 'string', enum: ['square', 'circle'], default: 'square' },
          radius: { description: 'Aceita 4 ou "4px"', oneOf: [{ type: 'integer' }, { type: 'string' }] },
          type: { type: 'string', enum: ['text', 'color'], default: 'text' },
          values: { type: 'array', items: { type: 'string' }, example: ['PP', 'M', 'GG'] },
        },
      },
      ProductCreate: {
        type: 'object',
        required: ['name', 'slug', 'price', 'price_with_discount'],
        properties: {
          enabled: { type: 'boolean', default: false },
          name: { type: 'string', example: 'Produto 01' },
          slug: { type: 'string', example: 'produto-01' },
          use_in_menu: { type: 'boolean', default: false },
          stock: { type: 'integer', default: 0, example: 10 },
          description: { type: 'string', maxLength: 255 },
          price: { type: 'number', example: 119.9 },
          price_with_discount: { type: 'number', example: 99.9 },
          category_ids: { type: 'array', items: { type: 'integer' }, example: [1, 2] },
          images: { type: 'array', items: ref('ProductImageInput') },
          options: { type: 'array', items: ref('ProductOptionInput') },
        },
      },
      ProductUpdate: {
        type: 'object',
        description: 'Todos os campos são opcionais; o que for omitido permanece inalterado.',
        properties: {
          enabled: { type: 'boolean' },
          name: { type: 'string' },
          slug: { type: 'string' },
          use_in_menu: { type: 'boolean' },
          stock: { type: 'integer' },
          description: { type: 'string', maxLength: 255 },
          price: { type: 'number' },
          price_with_discount: { type: 'number' },
          category_ids: { type: 'array', items: { type: 'integer' } },
          images: { type: 'array', items: ref('ProductImageInput') },
          options: { type: 'array', items: ref('ProductOptionInput') },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica a saúde da API e a conexão com o banco',
        responses: {
          200: jsonResponse('API e banco disponíveis', {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              database: { type: 'string', example: 'up' },
              uptime: { type: 'number', example: 123.4 },
            },
          }),
          503: jsonResponse('Banco indisponível', {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'error' },
              database: { type: 'string', example: 'down' },
            },
          }),
        },
      },
    },

    '/v1/user/token': {
      post: {
        tags: ['Users'],
        summary: 'Gera o token JWT',
        requestBody: jsonBody(ref('Login')),
        responses: {
          200: jsonResponse('Token gerado', ref('Token')),
          400: responses.badRequest,
        },
      },
    },
    '/v1/user': {
      post: {
        tags: ['Users'],
        summary: 'Cadastra um usuário',
        requestBody: jsonBody(ref('UserCreate')),
        responses: {
          201: jsonResponse('Usuário criado', ref('User')),
          400: responses.badRequest,
        },
      },
    },
    '/v1/user/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Obtém um usuário pelo ID',
        parameters: [idParam],
        responses: {
          200: jsonResponse('Usuário', ref('User')),
          400: responses.badRequest,
          404: responses.notFound,
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Atualiza um usuário',
        security: secured,
        parameters: [idParam],
        requestBody: jsonBody(ref('UserUpdate')),
        responses: {
          204: responses.noContent,
          400: responses.badRequest,
          401: responses.unauthorized,
          404: responses.notFound,
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Remove um usuário',
        security: secured,
        parameters: [idParam],
        responses: {
          204: responses.noContent,
          401: responses.unauthorized,
          404: responses.notFound,
        },
      },
    },

    '/v1/category/search': {
      get: {
        tags: ['Categories'],
        summary: 'Lista categorias (paginação, filtro e seleção de campos)',
        parameters: [
          ...paginationParams(12),
          {
            name: 'fields',
            in: 'query',
            description: 'Campos retornados, separados por vírgula',
            schema: { type: 'string', example: 'name,slug' },
          },
          {
            name: 'use_in_menu',
            in: 'query',
            description: 'Filtra apenas categorias que podem aparecer no menu',
            schema: { type: 'boolean' },
          },
        ],
        responses: { 200: jsonResponse('Lista paginada', ref('CategoryList')), 400: responses.badRequest },
      },
    },
    '/v1/category': {
      post: {
        tags: ['Categories'],
        summary: 'Cadastra uma categoria',
        security: secured,
        requestBody: jsonBody(ref('CategoryInput')),
        responses: {
          201: jsonResponse('Categoria criada', ref('Category')),
          400: responses.badRequest,
          401: responses.unauthorized,
        },
      },
    },
    '/v1/category/{id}': {
      get: {
        tags: ['Categories'],
        summary: 'Obtém uma categoria pelo ID',
        parameters: [idParam],
        responses: {
          200: jsonResponse('Categoria', ref('Category')),
          400: responses.badRequest,
          404: responses.notFound,
        },
      },
      put: {
        tags: ['Categories'],
        summary: 'Atualiza uma categoria',
        security: secured,
        parameters: [idParam],
        requestBody: jsonBody(ref('CategoryInput')),
        responses: {
          204: responses.noContent,
          400: responses.badRequest,
          401: responses.unauthorized,
          404: responses.notFound,
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Remove uma categoria',
        security: secured,
        parameters: [idParam],
        responses: {
          204: responses.noContent,
          401: responses.unauthorized,
          404: responses.notFound,
        },
      },
    },

    '/v1/product/search': {
      get: {
        tags: ['Products'],
        summary: 'Lista produtos (paginação, busca e filtros)',
        parameters: [
          ...paginationParams(12),
          {
            name: 'fields',
            in: 'query',
            description: 'Campos retornados, separados por vírgula',
            schema: { type: 'string', example: 'name,images,price' },
          },
          {
            name: 'match',
            in: 'query',
            description: 'Termo buscado no nome ou na descrição',
            schema: { type: 'string', example: 'Tênis' },
          },
          {
            name: 'category_ids',
            in: 'query',
            description: 'IDs de categorias separados por vírgula',
            schema: { type: 'string', example: '15,24' },
          },
          {
            name: 'price-range',
            in: 'query',
            description: 'Faixa de preço no formato min-max',
            schema: { type: 'string', example: '100-200' },
          },
          {
            name: 'option',
            in: 'query',
            description: 'Filtra pelos valores de uma opção: option[45]=GG,PP',
            style: 'deepObject',
            explode: true,
            schema: { type: 'object', additionalProperties: { type: 'string' } },
            example: { 45: 'GG,PP' },
          },
        ],
        responses: { 200: jsonResponse('Lista paginada', ref('ProductList')), 400: responses.badRequest },
      },
    },
    '/v1/product': {
      post: {
        tags: ['Products'],
        summary: 'Cadastra um produto (com categorias, imagens e opções)',
        security: secured,
        requestBody: jsonBody(ref('ProductCreate')),
        responses: {
          201: jsonResponse('Produto criado', ref('Product')),
          400: responses.badRequest,
          401: responses.unauthorized,
        },
      },
    },
    '/v1/product/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Obtém um produto pelo ID',
        parameters: [idParam],
        responses: {
          200: jsonResponse('Produto', ref('Product')),
          400: responses.badRequest,
          404: responses.notFound,
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Atualiza um produto (campos, categorias, imagens e opções)',
        security: secured,
        parameters: [idParam],
        requestBody: jsonBody(ref('ProductUpdate')),
        responses: {
          204: responses.noContent,
          400: responses.badRequest,
          401: responses.unauthorized,
          404: responses.notFound,
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Remove um produto',
        security: secured,
        parameters: [idParam],
        responses: {
          204: responses.noContent,
          401: responses.unauthorized,
          404: responses.notFound,
        },
      },
    },
  },
};
