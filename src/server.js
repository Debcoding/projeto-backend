'use strict';

/** Ponto de entrada: confere a conexão com o banco e abre a porta HTTP. */
const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida.');
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`API rodando em ${env.appUrl}`);
    console.log(`Documentação: ${env.appUrl}/api-docs`);
  });

  // Encerramento gracioso (Ctrl+C / deploy)
  const shutdown = (signal) => {
    console.log(`${signal} recebido. Encerrando...`);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
