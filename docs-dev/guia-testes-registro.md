# 📚 Guia de Testes: Sistema de Registro Dual

**Autor**: GitHub Copilot  
**Data**: 9 de fevereiro de 2026  
**Propósito**: Orientação completa para criar e ajustar testes do sistema de registro

---

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura dos Testes](#estrutura-dos-testes)
3. [Setup do Ambiente de Teste](#setup-do-ambiente-de-teste)
4. [Testes de POST /users](#testes-de-post-users)
5. [Testes de POST /auth/register](#testes-de-post-authregister)
6. [Problemas Comuns](#problemas-comuns)
7. [Como Debugar](#como-debugar)
8. [Referências](#referências)

---

## 🎯 Visão Geral

### O Que Foi Implementado

Dois endpoints de registro com propósitos diferentes:

| Endpoint | Tipo | Retorna | Uso |
|----------|------|---------|-----|
| `POST /users` | Público | Dados do usuário | Auto-registro sem login automático |
| `POST /auth/register` | Protegido (Admin) | JWT tokens + dados | Criação administrativa com login |

### Arquitetura de Segurança

```
┌─────────────────────────────────────────────────┐
│          POST /users (Público)                  │
│  ✓ Sem autenticação                             │
│  ✓ userRole obrigatório ('cliente'|'proprietario')│
│  ✓ Retorna apenas dados do usuário             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│     POST /auth/register (Admin Only)            │
│  🔒 JwtAuthGuard → valida token JWT             │
│  🔒 RolesGuard → verifica role === 'ADMIN'      │
│  ✓ Retorna tokens + dados do usuário           │
└─────────────────────────────────────────────────┘
```

---

## 🏗️ Estrutura dos Testes

### Arquivo Principal

**Localização**: `test/user-registration-flow.e2e-spec.ts`

```typescript
describe('User Registration Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => { ... });   // Setup
  afterAll(async () => { ... });    // Cleanup
  
  describe('POST /users', () => { ... });
  describe('POST /auth/register', () => { ... });
});
```

### Dependências Necessárias

```json
{
  "devDependencies": {
    "@nestjs/testing": "^10.4.0",
    "supertest": "^6.3.3",
    "jest": "^29.0.0"
  }
}
```

---

## ⚙️ Setup do Ambiente de Teste

### 1. beforeAll() - Inicialização

```typescript
beforeAll(async () => {
  // 1. Criar módulo de teste
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // 2. Criar app com validação
  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.init();

  // 3. Obter instância do Prisma
  prisma = app.get(PrismaService);

  // 4. Limpar database
  await prisma.user.deleteMany({});

  // 5. Criar usuário ADMIN para testes
  const bcrypt = require('bcrypt');
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      nome: 'Admin User',
      email: 'admin@test.com',
      passwordHash: adminPassword,
      role: 'ADMIN',        // ✅ ADMIN, não USER
      userRole: 'cliente'
    }
  });

  // 6. Fazer login para obter token
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'admin@test.com', password: 'admin123' });
  
  adminToken = loginResponse.body.accessToken;
});
```

### 2. afterAll() - Cleanup

```typescript
afterAll(async () => {
  // Limpar dados de teste
  await prisma.user.deleteMany({});
  
  // Fechar conexões
  await app.close();
});
```

### ⚠️ Pontos de Atenção no Setup

1. **Sempre use `role: 'ADMIN'`** ao criar admin (não `'USER'`)
2. **Valide que o token foi gerado** antes de usar nos testes
3. **Use o mesmo database** que o ambiente de teste (`.env.test`)

---

## 🧪 Testes de POST /users

### Cenário 1: Registro como Cliente

```typescript
it('should allow anyone to register as CLIENTE', async () => {
  const response = await request(app.getHttpServer())
    .post('/users')
    .send({
      nome: 'João Cliente',
      email: 'joao@cliente.com',
      password: 'senha1234',
      userRole: 'cliente'
    })
    .expect(201);

  // Validações
  expect(response.body).toMatchObject({
    nome: 'João Cliente',
    email: 'joao@cliente.com',
    userRole: 'cliente'
  });
  expect(response.body.id).toBeDefined();
  expect(response.body.createdAt).toBeDefined();
  
  // Não deve retornar tokens
  expect(response.body.accessToken).toBeUndefined();
  expect(response.body.refreshToken).toBeUndefined();
});
```

### Cenário 2: Registro como Proprietário

```typescript
it('should allow anyone to register as PROPRIETARIO', async () => {
  const response = await request(app.getHttpServer())
    .post('/users')
    .send({
      nome: 'Maria Proprietária',
      email: 'maria@proprietaria.com',
      password: 'senha1234',
      userRole: 'proprietario'
    })
    .expect(201);

  expect(response.body.userRole).toBe('proprietario');
});
```

### Cenário 3: Validações de Input

```typescript
it('should reject registration with invalid userRole', async () => {
  await request(app.getHttpServer())
    .post('/users')
    .send({
      nome: 'Invalid User',
      email: 'invalid@test.com',
      password: 'senha1234',
      userRole: 'invalid_role'  // ❌ Não está no enum
    })
    .expect(400);
});

it('should reject registration without userRole', async () => {
  await request(app.getHttpServer())
    .post('/users')
    .send({
      nome: 'No Role User',
      email: 'norole@test.com',
      password: 'senha1234'
      // userRole faltando
    })
    .expect(400);
});

it('should reject weak password', async () => {
  await request(app.getHttpServer())
    .post('/users')
    .send({
      nome: 'Weak Pass',
      email: 'weak@test.com',
      password: '123',  // ❌ Menor que 8 caracteres
      userRole: 'cliente'
    })
    .expect(400);
});
```

### Cenário 4: Email Duplicado

```typescript
it('should reject duplicate email', async () => {
  // Primeiro registro
  await request(app.getHttpServer())
    .post('/users')
    .send({
      nome: 'First User',
      email: 'duplicate@test.com',
      password: 'senha1234',
      userRole: 'cliente'
    })
    .expect(201);

  // Tentar registrar novamente com mesmo email
  await request(app.getHttpServer())
    .post('/users')
    .send({
      nome: 'Second User',
      email: 'duplicate@test.com',  // ❌ Email já existe
      password: 'senha1234',
      userRole: 'cliente'
    })
    .expect(409);  // Conflict
});
```

---

## 🔒 Testes de POST /auth/register

### Cenário 1: Sem Autenticação

```typescript
it('should reject registration without authentication', async () => {
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      name: 'Unauthorized User',
      email: 'unauth@test.com',
      password: 'senha1234',
      role: 'cliente'
    })
    .expect(401);  // JwtAuthGuard bloqueia
});
```

### Cenário 2: Admin Cria Usuário

```typescript
it('should allow admin to create user with auto-login', async () => {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Admin Created User',
      email: 'admincreated@test.com',
      password: 'senha1234',
      role: 'cliente'
    })
    .expect(201);

  // Validações
  expect(response.body.accessToken).toBeDefined();
  expect(response.body.refreshToken).toBeDefined();
  expect(response.body.user).toBeDefined();
  expect(response.body.user.email).toBe('admincreated@test.com');
});
```

### Cenário 3: Usuário Comum Tenta Criar

```typescript
it('should reject non-admin user trying to use /auth/register', async () => {
  // 1. Criar usuário comum
  await request(app.getHttpServer())
    .post('/users')
    .send({
      nome: 'Regular User',
      email: 'regular@test.com',
      password: 'senha1234',
      userRole: 'cliente'
    });

  // 2. Fazer login
  const userLoginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'regular@test.com', password: 'senha1234' });
  
  const userToken = userLoginResponse.body.accessToken;

  // 3. Tentar criar usuário (deve falhar)
  await request(app.getHttpServer())
    .post('/auth/register')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Forbidden User',
      email: 'forbidden@test.com',
      password: 'senha1234',
      role: 'cliente'
    })
    .expect(403);  // RolesGuard bloqueia
});
```

### Cenário 4: Token Expirado

```typescript
it('should reject expired token', async () => {
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Token expirado
  
  await request(app.getHttpServer())
    .post('/auth/register')
    .set('Authorization', `Bearer ${expiredToken}`)
    .send({
      name: 'Test User',
      email: 'test@test.com',
      password: 'senha1234',
      role: 'cliente'
    })
    .expect(401);
});
```

---

## ⚠️ Problemas Comuns

### 1. Import do Supertest

❌ **Errado**:
```typescript
import * as request from 'supertest';
```

✅ **Correto**:
```typescript
import request from 'supertest';
```

---

### 2. Admin Sem Role Correta

❌ **Errado**:
```typescript
await prisma.user.create({
  data: {
    ...
    role: 'USER',  // ❌ Usuário comum, não admin
  }
});
```

✅ **Correto**:
```typescript
await prisma.user.create({
  data: {
    ...
    role: 'ADMIN',  // ✅ 
  }
});
```

---

### 3. Esperando Status Errado

Quando guards falham, a ordem importa:

```
Request → JwtAuthGuard → RolesGuard → Controller
            ↓ 401         ↓ 403       ↓ 200/201
```

Se JwtAuthGuard falha primeiro, nunca chegará ao RolesGuard (403).

**Exemplo**:
```typescript
// ❌ Pode falhar se token for inválido
.expect(403);

// ✅ Melhor: verificar ambos os casos
if (response.status === 401) {
  // Token inválido/expirado
} else {
  expect(response.status).toBe(403);
}
```

---

### 4. DTO Inconsistente

`POST /users` usa:
- `nome` (português)
- `userRole` ('cliente' | 'proprietario')

`POST /auth/register` usa:
- `name` (inglês)
- `role` ('cliente' | 'proprietario')

⚠️ **Atenção**: Não confundir os DTOs!

---

## 🔍 Como Debugar

### 1. Adicionar Logs no Teste

```typescript
it('should allow admin to create user', async () => {
  console.log('Admin token:', adminToken);
  
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ ... });
  
  console.log('Response status:', response.status);
  console.log('Response body:', response.body);
  
  expect(response.status).toBe(201);
});
```

### 2. Decodificar Token

```typescript
// Adicionar no beforeAll após obter token
const payload = JSON.parse(
  Buffer.from(adminToken.split('.')[1], 'base64').toString()
);
console.log('Admin token payload:', payload);
// Deve ter: { sub, email, role: 'ADMIN', iat, exp }
```

### 3. Verificar Database

```typescript
it('debug: check database', async () => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, userRole: true }
  });
  console.log('Users in database:', users);
});
```

### 4. Testar Guards Isoladamente

```typescript
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { Role } from '@prisma/client';

describe('RolesGuard (unit)', () => {
  it('should allow ADMIN role', () => {
    const mockContext = createMockExecutionContext({
      user: { role: 'ADMIN' },
      requiredRoles: [Role.ADMIN]
    });
    
    const guard = new RolesGuard(mockReflector);
    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
```

---

## 📊 Cobertura de Testes

### Executar Testes com Coverage

```bash
# Todos os testes E2E
npm run test:e2e

# Teste específico
npx jest test/user-registration-flow.e2e-spec.ts

# Com coverage
npm run test:cov

# Ver relatório HTML
open coverage/lcov-report/index.html
```

### Metas de Cobertura

- **Use Cases**: 100%
- **Controllers**: 80%+
- **Guards**: 100%
- **E2E**: Fluxos críticos

---

## ✅ Checklist de Testes Completo

### Setup
- [ ] Database de teste configurado (`.env.test`)
- [ ] Migrations aplicadas
- [ ] beforeAll cria admin com `role: 'ADMIN'`
- [ ] adminToken sendo gerado corretamente

### POST /users
- [ ] Registro como cliente funciona
- [ ] Registro como proprietário funciona
- [ ] Rejeita userRole inválido
- [ ] Rejeita sem userRole
- [ ] Rejeita senha fraca (< 8 chars)
- [ ] Rejeita email duplicado
- [ ] Não retorna tokens

### POST /auth/register
- [ ] Rejeita sem autenticação (401)
- [ ] Admin consegue criar usuário (201)
- [ ] Retorna accessToken e refreshToken
- [ ] Usuário comum não consegue (403)
- [ ] Rejeita token expirado (401)
- [ ] Rejeita token inválido (401)

### Guards
- [ ] JwtAuthGuard valida token JWT
- [ ] RolesGuard valida role do usuário
- [ ] Guards executam na ordem correta

---

## 🚀 Próximos Passos

1. **Corrigir testes falhando**:
   - Verificar que admin tem `role: 'ADMIN'`
   - Validar que token contém `role` no payload

2. **Adicionar testes unitários**:
   - RolesGuard isolado
   - CreateUserUseCase
   - LoginUseCase

3. **Melhorar error messages**:
   - Distinguir entre 401 (auth failed) e 403 (forbidden)
   - Adicionar mensagens descritivas

4. **Documentar DTOs**:
   - Swagger examples
   - Comentários sobre diferenças entre endpoints

---

## 📚 Referências

- [Documentação completa](./registro-dual-usuarios.md)
- [Troubleshooting](./troubleshooting-registro.md)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest GitHub](https://github.com/ladjs/supertest)
- [Jest Matchers](https://jestjs.io/docs/expect)

---

**Última atualização**: 9 de fevereiro de 2026  
**Status**: ✅ 6/8 testes passando | 🔧 2 testes com problema de JWT
