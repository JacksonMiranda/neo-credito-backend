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
docker-compose up -d --build
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
docker-compose up -d postgres
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
- `PATCH /propostas/:id/status` (exclusivo para OPERADOR)
- `DELETE /propostas/:id`

As alteracoes de status das propostas sao registradas em historico interno no banco de dados.

### Atualizacao de status vs cancelamento

- `PATCH /propostas/:id/status` e exclusivo do perfil OPERADOR e cobre todas as transicoes de status, incluindo aprovacao, reprovacao e envio para analise. Tambem pode ser usado pelo OPERADOR para cancelar uma proposta em RASCUNHO ou EM_ANALISE enviando `status: CANCELADA`.
- `DELETE /propostas/:id` e o canal de cancelamento por perfil:
  - CORBAN cancela apenas propostas proprias em RASCUNHO.
  - OPERADOR cancela propostas em RASCUNHO ou EM_ANALISE.
- O CORBAN nao deve tentar cancelar propostas via `PATCH /propostas/:id/status`. Esse endpoint retorna 403 para CORBAN mesmo que o payload contenha `status: CANCELADA`.

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

## Decisoes tecnicas

- Escolhi NestJS por oferecer organizacao modular, decorators, guards, pipes e integracao madura com Swagger, o que facilita a separacao entre autenticacao, propostas, validacao e persistencia.
- Usei Prisma com PostgreSQL para garantir tipagem forte no acesso ao banco, migrations versionadas e clareza no modelo de dominio.
- Centralizei o calculo de taxa, parcela e total em um servico proprio para manter a regra de negocio isolada e testavel.
- Separei a validacao de transicoes de status em um servico dedicado para evitar regras espalhadas no controller.
- Usei JWT stateless com expiracao configuravel por variavel de ambiente.
- Padronizei a resposta de erro no formato `{ error, details }` por meio de `exceptionFactory` no `ValidationPipe` global e excecoes manuais nos guards e services.
- Inclui historico de transicoes de status como reforco de rastreabilidade, mesmo nao sendo um endpoint obrigatorio.
- Optei por validar apenas o formato do CPF (11 digitos numericos, aceitando com ou sem mascara), sem checagem matematica dos digitos verificadores, para nao bloquear CPFs ficticios usados em avaliacao manual.

## O que faria diferente com mais tempo

- Adicionaria endpoint para consulta do historico de status de uma proposta.
- Criaria testes e2e usando PostgreSQL real em container, alem dos testes com fake Prisma.
- Adicionaria CI no GitHub Actions para rodar lint, testes e build a cada push.
- Melhoraria observabilidade com logs estruturados e correlation id.
- Implementaria paginacao com metadados adicionais, como `totalPages`, `hasNextPage` e `hasPreviousPage`.
- Adicionaria versionamento de API, por exemplo `/v1`.
