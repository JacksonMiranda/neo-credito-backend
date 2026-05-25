# Neo Credito Backend

API REST para o modulo de Propostas de Credito da Neo Credito.

O projeto usa NestJS, TypeScript, Prisma e PostgreSQL para expor autenticacao JWT e o fluxo de propostas de credito com cadastro, consulta, alteracao de status e cancelamento logico.

## Tecnologias

- Node.js 18+
- TypeScript
- NestJS
- Prisma
- PostgreSQL
- Docker Compose
- Jest
- ESLint e Prettier
- Swagger

## Configuracao inicial

Para subir a API e o PostgreSQL com Docker:

```bash
docker compose up -d --build
```

Na primeira subida, o container da API aplica as migrations do Prisma. O seed tambem e executado porque o `docker-compose.yml` define `SEED_DATABASE=true`.

Usuarios iniciais criados pelo seed:

- `corban1@neocredito.com.br`
- `corban2@neocredito.com.br`
- `operador@neocredito.com.br`

Senha dos usuarios de seed:

- `Teste@2024`

Para rodar a aplicacao localmente usando apenas o PostgreSQL do Docker:

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

## Variaveis de ambiente

Veja `.env.example`.

- `DATABASE_URL`: URL de conexao do PostgreSQL usada pelo Prisma
- `JWT_SECRET`: segredo obrigatorio usado na autenticacao JWT
- `JWT_EXPIRES_IN`: tempo de expiracao do token JWT
- `AUTH_LOGIN_RATE_LIMIT_MAX`: maximo de tentativas por janela no login
- `AUTH_LOGIN_RATE_LIMIT_WINDOW_MS`: janela do rate limit de login em milissegundos
- `PORT`: porta HTTP da API
- `SEED_DATABASE`: quando `true`, executa seed ao iniciar o container da API

Nunca versionar `.env`.

## Comandos

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Documentacao da API

Com a aplicacao em execucao, a documentacao Swagger fica disponivel em:

- `http://localhost:3000/docs`
- `http://localhost:3000/docs-json`

## Rotas disponiveis

- `POST /auth/login`
- `GET /auth/me`
- `POST /propostas`
- `GET /propostas`
- `GET /propostas/:id`
- `PATCH /propostas/:id/status`
- `DELETE /propostas/:id`

As alteracoes de status das propostas sao registradas em historico interno no banco de dados.

## Estrutura

```text
src/
  app.module.ts
  main.ts
  database/
    database.module.ts
    prisma.service.ts
  modules/
    auth/
      dto/
      guards/
      strategies/
      types/
    propostas/
      dto/
      services/
    users/
  shared/
    decorators/
    dto/
    guards/
  config/
prisma/
  migrations/
  schema.prisma
  seed.ts
test/
  app.e2e-spec.ts
```
