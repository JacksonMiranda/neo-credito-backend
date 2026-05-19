# Neo Credito Backend

API REST para o modulo de Propostas de Credito da Neo Credito.

Este primeiro commit prepara a base do projeto: NestJS, TypeScript, Prisma, PostgreSQL via Docker, configuracao de ambiente, estrutura inicial de banco e comandos de validacao.

## Tecnologias

- Node.js 18+
- TypeScript
- NestJS
- Prisma
- PostgreSQL
- Docker Compose
- Jest
- ESLint e Prettier

## Configuracao inicial

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
```

## Variaveis de ambiente

Veja `.env.example`.

- `DATABASE_URL`: URL de conexao do PostgreSQL usada pelo Prisma
- `JWT_SECRET`: segredo que sera usado na autenticacao JWT
- `JWT_EXPIRES_IN`: tempo de expiracao do token JWT
- `PORT`: porta HTTP da API

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

## Estrutura inicial

```text
src/
  app.module.ts
  main.ts
  database/
    database.module.ts
    prisma.service.ts
  modules/
    auth/
    propostas/
    users/
  shared/
prisma/
  schema.prisma
  seed.ts
test/
  app.e2e-spec.ts
```
