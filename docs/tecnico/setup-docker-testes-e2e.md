# Setup Docker Local para Testes E2E

## Visão Geral

Este documento descreve como configurar um banco PostgreSQL local via Docker para executar os testes e2e, substituindo o Supabase.

## Pré-requisitos

- Docker Desktop instalado e rodando
- Docker Compose instalado (já vem com Docker Desktop)
- Node.js 18+ instalado

---

## Arquivos para Olhar

Antes de começar, o dev deve consultar estes arquivos existentes:

| Arquivo | O que verificar |
|---------|-----------------|
| `package.json` | Scripts existentes de teste (linhas 16-22) |
| `.env.test` | Variáveis de ambiente atuais |
| `test/jest-e2e.json` | Configuração atual dos testes e2e |
| `test/jest.setup.ts` | Setup atual do Jest |
| `prisma/schema.prisma` | Schema do banco |

### Scripts Existentes no package.json

Os scripts atuais são (não mexer nesses):
```json
"test": "jest --config jest.config.js",
"test:e2e": "prisma migrate deploy && jest --config test/jest-e2e.json",
"test:e2e:local": "./scripts/test-e2e-local.sh",
"test:integration:local": "DATABASE_URL=postgresql://test_user:test_password@localhost:5433/imobix_test?schema=public ...",
```

---

## O que o Dev Deve Fazer

### Tarefa 1: Criar arquivo docker-compose.test.yml

**Novo arquivo:** `docker-compose.test.yml` (na raiz do projeto)

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:15-alpine
    container_name: imobix-postgres-test
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: imobix_test
    ports:
      - "5433:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d imobix_test"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_test_data:
```

---

### Tarefa 2: Atualizar .env.test

**Arquivo existente:** `.env.test`

**Modificar de:**
```env
DATABASE_URL="postgresql://postgres.pqtqsikpyrqhjxhwhqnp:jRY8yWL4Cd5M6JxhqritgZXcF4@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:jRY8yWL4Cd5M6JxhqritgZXcF4@db.pqtqsikpyrqhjxhwhqnp.supabase.co:5432/postgres"
```

**Para:**
```env
# Database Local Docker
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/imobix_test?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/imobix_test?schema=public"

# Configurações da aplicação
PORT=3000
BCRYPT_SALT_ROUNDS=10
JWT_SECRET="super-secret-key-change-in-production"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d
CLOUDINARY_CLOUD_NAME="

# Cloudinarydtl5wdhnu
CLOUDINARY_API_KEY=398519331477366
CLOUDINARY_API_SECRET=02c76UvTJNyX-qPtms6IW_JmaII
```

---

### Tarefa 3: Atualizar package.json

**Arquivo existente:** `package.json`

**Adicionar estes scripts** (não remover os existentes):

```json
{
  "scripts": {
    "test:e2e:docker:up": "docker-compose -f docker-compose.test.yml up -d",
    "test:e2e:docker:down": "docker-compose -f docker-compose.test.yml down",
    "test:e2e:docker:restart": "npm run test:e2e:docker:down && npm run test:e2e:docker:up",
    "test:e2e:docker:logs": "docker-compose -f docker-compose.test.yml logs -f postgres-test",
    "test:e2e:clean": "docker-compose -f docker-compose.test.yml down -v"
  }
}
```

---

### Tarefa 4: Atualizar test/jest-e2e.json

**Arquivo existente:** `test/jest-e2e.json`

**Manter como está** (já está correto):
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node",
  "testTimeout": 30000,
  "setupFiles": ["<rootDir>/test/jest.setup.ts"]
}
```

**Verificar se o `setupFiles` aponta para o .env.test correto** no arquivo `test/jest.setup.ts`.

---

### Tarefa 5: Atualizar test/jest.setup.ts

**Arquivo existente:** `test/jest.setup.ts`

**Verificar se está carregando o .env.test:**

```typescript
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
```

---

## Passo a Passo para Executar

### 1. Primeira vez (setup)

```bash
# Subir banco Docker
npm run test:e2e:docker:up

# Criar schema no banco
npx prisma db push --schema=./prisma/schema.prisma

# Gerar Prisma Client
npx prisma generate

# Rodar testes
npm run test:e2e
```

### 2. Desenvolvimento diário

```bash
# Verificar se banco está rodando
docker ps | grep postgres-test

# Se não estiver, subir
npm run test:e2e:docker:up

# Rodar testes
npm run test:e2e
```

### 3. Cleanup

```bash
# Para tudo e limpa volumes (banco volta vazio)
npm run test:e2e:clean
```

---

## Troubleshooting

### Erro: "Connection refused"

```bash
npm run test:e2e:docker:up
```

### Erro: "Database does not exist"

```bash
npx prisma db push --schema=./prisma/schema.prisma
```

### Erro: "Port 5433 already in use"

Mudar porta no `docker-compose.test.yml` para 5434 e atualizar `.env.test`.

### Erro: "Role postgres does not exist"

O banco precisa ser criado. Verificar logs:
```bash
npm run test:e2e:docker:logs
```

---

## Checklist de Validação

- [ ] Docker Desktop instalado e rodando
- [ ] `docker-compose.test.yml` criado
- [ ] `.env.test` atualizado com credenciais locais
- [ ] Scripts adicionados no `package.json`
- [ ] Testado: `npm run test:e2e:docker:up` ✓
- [ ] Testado: `npx prisma db push` ✓
- [ ] Testado: `npm run test:e2e` com sucesso ✓

---

## Referências

- Imagem Docker: `postgres:15-alpine`
- Porta: `5433` (evita conflito com 5432)
- Banco: `imobix_test`
- Usuário: `postgres`
- Senha: `postgres`

---

## Observações

1. **Cada dev precisa de Docker instalado** - não tem como evitar
2. **Porta 5433** - para evitar conflito com PostgreSQL local
3. **Volume persistente** - dados ficam salvos. Use `test:e2e:clean` para limpar
4. **Cloudinary** - continua sendo usado nos testes (não muda)
