// Executado pelo Jest ANTES de cada arquivo de teste: define o ambiente isolado.
const os = require('node:os');
const path = require('node:path');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'segredo-de-teste';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '4'; // hash rápido nos testes
process.env.APP_URL = 'http://localhost:3000';
// Uma pasta de uploads por worker do Jest, para os testes não colidirem
process.env.UPLOAD_DIR = path.join(os.tmpdir(), `store-api-uploads-${process.env.JEST_WORKER_ID}`);
