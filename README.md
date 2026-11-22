# Store API

API REST para gerenciamento de **usuários**, **categorias** e **produtos** (com imagens e opções), construída com Node.js, Express 5, MySQL e Sequelize. Os requisitos funcionais originais estão em [`docs/ESCOPO.md`](docs/ESCOPO.md).

## Possíveis usos

- Back end de uma **loja virtual / e-commerce** (catálogo, menu de categorias, busca e filtros de produtos).
- **Painel administrativo** de catálogo: cadastro e manutenção de produtos, imagens e variações (tamanho, cor).
- Base para **estudo ou projeto de portfólio** de API REST com autenticação JWT, migrations, testes automatizados e documentação Swagger.
- Ponto de partida para **MVPs** de marketplaces, cardápios digitais ou vitrines de produtos.

## Requisitos

| Item                              | Versão         | Observação                                             |
| --------------------------------- | -------------- | ------------------------------------------------------ |
| [Node.js](https://nodejs.org/)    | 20 ou superior |                                                        |
| [pnpm](https://pnpm.io/)          | 11 ou superior | gerenciador de pacotes do projeto                      |
| [MySQL](https://www.mysql.com/)   | 8.x            | local **ou** via Docker (`docker-compose.yml` incluso) |
| [Docker](https://www.docker.com/) | opcional       | só se for usar o MySQL em contêiner                    |
| Git                               | qualquer       | para clonar o repositório                              |

> Os testes automatizados **não precisam de MySQL**: usam SQLite em memória.

## Estrutura do projeto

```
store-api/
├── docs/
│   └── ESCOPO.md              # especificação original dos requisitos
├── src/
│   ├── config/
│   │   ├── database.js        # conexão por ambiente (usada pela app e pelo sequelize-cli)
│   │   └── env.js             # leitura/validação das variáveis de ambiente
│   ├── controllers/           # recebem a requisição e devolvem a resposta HTTP
│   ├── docs/
│   │   └── openapi.js         # especificação OpenAPI (Swagger)
│   ├── middleware/            # authenticate (JWT), validate (Joi), notFound, errorHandler
│   ├── migrations/            # criação das tabelas (versionamento do schema)
│   ├── models/                # models Sequelize e associações
│   ├── routes/                # definição das rotas /v1/...
│   ├── seeders/               # dados de demonstração
│   ├── services/              # regras de negócio e acesso ao banco
│   ├── utils/                 # AppError
│   ├── validators/            # schemas de validação (Joi)
│   ├── app.js                 # monta o Express (sem abrir porta)
│   └── server.js              # ponto de entrada: conecta ao banco e abre a porta
├── tests/                     # testes automatizados (Jest + Supertest)
├── .env.example               # modelo de variáveis de ambiente
├── .sequelizerc               # caminhos usados pelo sequelize-cli
├── docker-compose.yml         # MySQL para desenvolvimento
├── eslint.config.js
├── jest.config.js
├── package.json
└── pnpm-workspace.yaml        # configurações do pnpm (overrides e builds permitidos)
```

Fluxo de uma requisição (MVC em camadas):
`route → authenticate → validate → controller → service → model/banco`, com o `errorHandler` global tratando qualquer erro.

## Tecnologias usadas

| Tecnologia                            | Para que serve                                 |
| ------------------------------------- | ---------------------------------------------- |
| **Node.js**                           | executar JavaScript no servidor                |
| **Express 5**                         | rotas e middlewares da API                     |
| **MySQL** + **mysql2**                | persistência dos dados                         |
| **Sequelize** + **sequelize-cli**     | ORM, models, migrations e seeders              |
| **JWT** (`jsonwebtoken`)              | autenticação das rotas de escrita              |
| **bcrypt**                            | hash das senhas                                |
| **Joi**                               | validação dos dados de entrada                 |
| **Swagger UI** (`swagger-ui-express`) | documentação interativa em `/api-docs`         |
| **Dotenv**                            | configuração por variáveis de ambiente         |
| **Helmet** e **CORS**                 | cabeçalhos de segurança e acesso entre origens |
| **Jest** + **Supertest** + **SQLite** | testes automatizados de integração             |
| **ESLint**                            | análise estática do código                     |
| **pnpm**                              | gerenciador de pacotes                         |
| **Nodemon**                           | reinício automático em desenvolvimento         |

## Passo a passo para configuração local

**1. Clone o repositório e instale as dependências**

```bash
git clone <url-do-repositorio> store-api
cd store-api
pnpm install
```

**2. Crie o arquivo de variáveis de ambiente**

```bash
cp .env.example .env
```

Abra o `.env` e ajuste `JWT_SECRET` (use um segredo longo e aleatório).
Para gerar um use:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

**3. Suba o MySQL** (escolha uma opção)

- _Com Docker_ (já usa os valores padrão do `.env.example`):
  ```bash
  pnpm run docker:up
  ```
- _MySQL instalado na máquina_: confirme que o servidor está ativo e que `DB_HOST`, `DB_PORT`, `DB_USER` e `DB_PASSWORD` do `.env` estão corretos.

**4. Crie o banco e as tabelas**

```bash
pnpm run db:create    # cria o banco definido em DB_NAME
pnpm run db:migrate   # cria as tabelas
pnpm run db:seed      # (opcional) usuário demo@mail.com / 123@123 e 3 categorias
```

**5. Inicie a API**

```bash
pnpm run dev          # desenvolvimento, com reinício automático
# ou
pnpm start            # execução normal
```

**6. Confira que está funcionando**

- Saúde da API: <http://localhost:3000/health>
- Documentação Swagger: <http://localhost:3000/api-docs>

**7. Teste o fluxo de autenticação**

```bash
# 1) obter o token (usuário criado pelo seed)
curl -X POST http://localhost:3000/v1/user/token \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@mail.com","password":"123@123"}'

# 2) usar o token em uma rota protegida
curl -X POST http://localhost:3000/v1/category \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Camisetas","slug":"camisetas","use_in_menu":true}'
```

No Swagger, use o botão **Authorize** e cole o token para testar as rotas protegidas.

## Tabela de comandos para o terminal

| Comando                        | Descrição                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `pnpm install`                 | instala as dependências                                                                |
| `pnpm start`                   | inicia a API (`node src/server.js`)                                                    |
| `pnpm run dev`                 | inicia a API com Nodemon (reinicia ao salvar arquivos)                                 |
| `pnpm test`                    | executa todos os testes (SQLite em memória)                                            |
| `pnpm run test:watch`          | executa os testes em modo observação                                                   |
| `pnpm run test:coverage`       | executa os testes e gera o relatório de cobertura (`coverage/`)                        |
| `pnpm run lint`                | analisa o código com o ESLint                                                          |
| `pnpm run lint:fix`            | analisa e corrige automaticamente o que for possível                                   |
| `pnpm run security:audit`      | procura vulnerabilidades conhecidas nas dependências de produção (`pnpm audit --prod`) |
| `pnpm run docker:up`           | sobe o MySQL em contêiner (em segundo plano)                                           |
| `pnpm run docker:down`         | derruba o contêiner do MySQL                                                           |
| `pnpm run db:create`           | cria o banco de dados                                                                  |
| `pnpm run db:drop`             | remove o banco de dados                                                                |
| `pnpm run db:migrate`          | aplica as migrations pendentes                                                         |
| `pnpm run db:migrate:status`   | mostra quais migrations já foram aplicadas                                             |
| `pnpm run db:migrate:undo`     | desfaz a última migration                                                              |
| `pnpm run db:migrate:undo:all` | desfaz todas as migrations                                                             |
| `pnpm run db:seed`             | insere os dados de demonstração                                                        |
| `pnpm run db:seed:undo`        | remove os dados de demonstração                                                        |
| `pnpm run db:reset`            | desfaz tudo, recria as tabelas e executa o seed                                        |

## Formas de verificação da saúde do código

1. **Testes automatizados** — `pnpm test`. Cobrem o CRUD completo de usuários, categorias e produtos, autenticação (401), validações (400), recursos inexistentes (404), paginação, filtros e remoção de arquivos de imagem. Todos devem passar.
2. **Cobertura de testes** — `pnpm run test:coverage`. Mostra no terminal (e em `coverage/lcov-report/index.html`) quais linhas e ramos ainda não são exercitados pelos testes.
3. **Análise estática** — `pnpm run lint`. Deve terminar sem erros; use `pnpm run lint:fix` para correções automáticas.
4. **Auditoria de dependências** — `pnpm run security:audit` aponta pacotes de produção com vulnerabilidades conhecidas.
5. **Pacotes desatualizados** — `pnpm outdated` lista dependências com versões novas disponíveis.
6. **Health check em execução** — `GET /health` retorna `200` com `{"status":"ok","database":"up"}` quando a API e o banco estão disponíveis, ou `503` quando o banco está fora. Serve também para monitoramento (load balancer, Docker, Kubernetes).
7. **Estado das migrations** — `pnpm run db:migrate:status` deve mostrar todas as migrations como `up`.
8. **Verificação manual** — a documentação em `/api-docs` permite exercitar todos os endpoints pelo navegador.

Sequência recomendada antes de enviar alterações:

```bash
pnpm run lint && pnpm test && pnpm run security:audit
```

## Endpoints

Documentação completa e interativa em `/api-docs` (JSON em `/api-docs.json`).

| Método | Rota                  | Auth | Sucesso                                                                               |
| ------ | --------------------- | :--: | ------------------------------------------------------------------------------------- |
| POST   | `/v1/user/token`      |  —   | 200 `{ token }`                                                                       |
| POST   | `/v1/user`            |  —   | 201                                                                                   |
| GET    | `/v1/user/:id`        |  —   | 200                                                                                   |
| PUT    | `/v1/user/:id`        | JWT  | 204                                                                                   |
| DELETE | `/v1/user/:id`        | JWT  | 204                                                                                   |
| GET    | `/v1/category/search` |  —   | 200 (`limit`, `page`, `fields`, `use_in_menu`)                                        |
| GET    | `/v1/category/:id`    |  —   | 200                                                                                   |
| POST   | `/v1/category`        | JWT  | 201                                                                                   |
| PUT    | `/v1/category/:id`    | JWT  | 204                                                                                   |
| DELETE | `/v1/category/:id`    | JWT  | 204                                                                                   |
| GET    | `/v1/product/search`  |  —   | 200 (`limit`, `page`, `fields`, `match`, `category_ids`, `price-range`, `option[id]`) |
| GET    | `/v1/product/:id`     |  —   | 200                                                                                   |
| POST   | `/v1/product`         | JWT  | 201                                                                                   |
| PUT    | `/v1/product/:id`     | JWT  | 204                                                                                   |
| DELETE | `/v1/product/:id`     | JWT  | 204                                                                                   |
| GET    | `/health`             |  —   | 200 / 503                                                                             |

Respostas de erro seguem o formato `{ "message": "...", "details": [{ "field": "...", "message": "..." }] }`.
