'use strict';

/**
 * Montagem da aplicação Express (sem abrir porta), o que permite
 * importá-la nos testes com o supertest.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const qs = require('qs');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const { sequelize } = require('./models');
const routes = require('./routes');
const openapi = require('./docs/openapi');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// O Express 5 usa o parser "simple" por padrão. Precisamos de objetos aninhados
// (option[45]=GG,PP); parseArrays:false evita que option[5] vire um array.
app.set('query parser', (text) => qs.parse(text, { parseArrays: false }));

// CSP desativada para não bloquear os scripts inline do Swagger UI.
// As imagens (/media) podem ser consumidas por front-ends de outras origens.
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
// Limite de 10 MB: imagens chegam em base64 dentro do JSON.
app.use(express.json({ limit: '10mb' }));

// Imagens dos produtos
app.use('/media', express.static(env.uploadDir));

// Verificação de saúde (útil para monitoramento e para checar a conexão com o banco)
app.get('/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: 'ok', database: 'up', uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

// Documentação interativa
app.get('/api-docs.json', (_req, res) => res.json(openapi));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

app.use('/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
