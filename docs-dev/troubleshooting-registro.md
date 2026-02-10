# 🐛 Troubleshooting: Registro Dual de Usuários

**Data**: 9 de fevereiro de 2026  
**Status**: Em desenvolvimento

---

## ❌ Problemas Encontrados e Soluções

### 1. userRole não sendo salvo no banco

**Sintoma**:
```
Expect userRole: 'proprietario'
Received userRole: 'cliente'
```

**Causa Raiz**:
`PrismaUserRepository.create()` não estava passando o campo `userRole` para o Prisma.

**Solução**:
```typescript
// src/infrastructure/database/prisma-user.repository.ts
async create(data: CreateUserData): Promise<User> {
  const user = await this.prisma.user.create({
    data: {
      nome: data.nome,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role as any || 'USER',
      userRole: data.userRole || 'cliente', // ✅ Adicionado
    }
  });
  return this.toDomain(user);
}
```

**Status**: ✅ Corrigido

---

### 2. POST /auth/register retornando 401 mesmo com token admin

**Sintoma**:
```
POST /auth/register
Authorization: Bearer <valid_admin_token>
Response: 401 Unauthorized
```

**Causas Possíveis**:

#### A. JWT não contém o campo `role`
Verificar payload do token:
```bash
echo "<token>" | cut -d'.' -f2 | base64 -d | jq
```

Deve conter:
```json
{
  "sub": "user_id",
  "email": "admin@test.com",
  "role": "ADMIN",  // ✅ Obrigatório
  "iat": ...,
  "exp": ...
}
```

Se `role` não estiver presente:
1. Verificar `LoginUseCase` passa `role` ao `tokenGenerator.generate()`
2. Verificar `JwtTokenGenerator` inclui `role` no payload
3. Verificar `User` entity tem o campo `role` populado no database

#### B. Token expirado
```bash
# Verificar data de expiração (exp)
date -r <timestamp_exp>
```

#### C. JwtAuthGuard falhou antes de RolesGuard
Se o token é inválido, nem chega no RolesGuard.

**Debugging**:
```typescript
// Adicionar log temporário em JwtStrategy.validate()
async validate(payload: any) {
  console.log('JWT Payload:', payload); // ✅
  return { userId: payload.sub, email: payload.email, role: payload.role };
}
```

**Status**: 🔍 Investigar no teste

---

### 3. Diferença entre DTOs dos endpoints

**POST /users** espera:
```typescript
{
  nome: string,      // ✅ português
  email: string,
  password: string,
  userRole: string   // ✅ 'cliente' | 'proprietario'
}
```

**POST /auth/register** espera:
```typescript
{
  name: string,      // ❌ inglês (inconsistência)
  email: string,
  password: string,
  role: string       // ❌ 'cliente' | 'proprietario' (mas campo chama 'role')
}
```

**Problema**: Inconsistência de nomenclatura pode causar confusão.

**Solução Recomendada**: Padronizar para português ou inglês em todo o projeto.

**Opção 1 - Padronizar RegisterDto** (menos breaking change):
```typescript
// src/auth/dto/register.dto.ts
export class RegisterDto {
  @IsString() nome: string;          // ✅ português
  @IsEmail() email: string;
  @MinLength(8) password: string;
  @IsEnum(UserRoleDto) userRole: UserRoleDto; // ✅ consistente
}
```

**Status**: ⚠️ Decisão de design necessária

---

### 4. Teste esperando 403 mas recebendo 401

**Sintoma**:
```
Expected 403 Forbidden
Received 401 Unauthorized
```

**Causa**:
`JwtAuthGuard` falha antes de `RolesGuard` executar.

**Guards executam em ordem**:
```
Request → JwtAuthGuard → RolesGuard → Controller
            ↓ 401           ↓ 403
```

Se JwtAuthGuard falha (token inválido/expirado), retorna 401 **antes** de verificar roles.

**Possíveis Causas**:
1. Token do usuário comum expirou durante o teste
2. Token não foi gerado corretamente no login
3. Payload do token não tem formato esperado

**Debug do Teste**:
```typescript
// test/user-registration-flow.e2e-spec.ts
it('should reject non-admin user trying to use /auth/register', async () => {
  const userLoginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'joao@cliente.com', password: 'senha1234' });
  
  console.log('User login response:', userLoginResponse.body); // ✅ Debug
  const userToken = userLoginResponse.body.accessToken;
  console.log('User token:', userToken); // ✅ Debug

  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ ... });
  
  console.log('Response status:', response.status); // ✅ Debug
  console.log('Response body:', response.body); // ✅ Debug
});
```

**Status**: 🔍 Investigar

---

## ✅ Checklist de Validação

### Database Schema
- [x] Campo `role` existe em User (ADMIN | USER)
- [x] Campo `userRole` existe em User ('cliente' | 'proprietario')
- [x] Migrations aplicadas (`npm run prisma:migrate:deploy`)

### Domain Layer
- [x] `User` entity tem propriedades `role` e `userRole`
- [x] `CreateUserData` type aceita `role` e `userRole`

### Application Layer
- [x] `CreateUserUseCase` passa `userRole` ao repository
- [x] `LoginUseCase` inclui `role` no token payload
- [x] `RegisterUserUseCase` (se existir) também inclui `role`

### Infrastructure Layer
- [x] `PrismaUserRepository.create()` salva `userRole` no banco
- [x] `JwtTokenGenerator` inclui `role` no payload
- [x] `JwtStrategy` extrai `role` do payload

### Interface Layer
- [x] `CreateUserDto` tem campo `userRole` obrigatório
- [ ] `RegisterDto` consistente (decidir nome dos campos)
- [x] `UsersController` passa `userRole` ao use case
- [x] `AuthController` protegido com guards

### Guards
- [x] `RolesGuard` implementado
- [x] `RolesGuard` registrado no AuthModule
- [x] `@Roles(Role.ADMIN)` aplicado em `/auth/register`

### Tests
- [x] Import do supertest corrigido (`import request from`)
- [ ] Admin token sendo gerado corretamente
- [ ] Admin token contém `role: 'ADMIN'`
- [ ] User comum não consegue acessar endpoints admin

---

## 🧪 Comandos de Debug

### 1. Verificar Schema do Database
```sql
-- Conectar no Supabase/Postgres
\d "User"

-- Verificar roles no banco
SELECT id, email, role, "userRole" FROM "User" LIMIT 5;
```

### 2. Testar Login Manual
```bash
# Login como admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  | jq

# Output esperado:
# {
#   "accessToken": "eyJ...",
#   "user": {
#     "id": "...",
#     "email": "admin@test.com",
#     "role": "ADMIN"  # ✅ Deve ter ADMIN
#   }
# }
```

### 3. Decodificar JWT
```bash
# Decodificar token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq

# Output esperado:
# {
#   "sub": "clx...",
#   "email": "admin@test.com",
#   "role": "ADMIN",  # ✅ Obrigatório
#   "iat": 1707516000,
#   "exp": 1707602400
# }
```

### 4. Testar Endpoint Admin Manualmente
```bash
# 1. Fazer login e capturar token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  | jq -r '.accessToken')

# 2. Tentar criar usuário
curl -X POST http://localhost:3000/auth/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "senha123",
    "role": "cliente"
  }' | jq
```

### 5. Rodar Teste com Logs Detalhados
```bash
# Habilitar logs do NestJS
DEBUG=* npm run test:e2e 2>&1 | grep -A5 -B5 "JWT\|role\|401\|403"
```

---

## 📋 Próximas Ações

### 1. Corrigir Teste E2E
- [ ] Verificar se admin está sendo criado com `role: 'ADMIN'` (não 'USER')
- [ ] Adicionar logs no teste para debug
- [ ] Validar que login retorna token com role correto

### 2. Padronizar DTOs
- [ ] Decidir: português ou inglês?
- [ ] Atualizar RegisterDto para ser consistente com CreateUserDto
- [ ] Atualizar testes após mudança de DTO

### 3. Melhorar Mensagens de Erro
```typescript
// RolesGuard.ts
canActivate(context: ExecutionContext): boolean {
  const requiredRoles = this.reflector.getAllAndOverride<Role[]>(...);
  
  if (!requiredRoles) return true;
  
  const { user } = context.switchToHttp().getRequest();
  
  const hasRole = requiredRoles.some((role) => user.role === role);
  
  if (!hasRole) {
    // ✅ Log para debug
    console.warn(`User ${user.email} (role: ${user.role}) tried to access endpoint requiring: ${requiredRoles}`);
  }
  
  return hasRole;
}
```

### 4. Adicionar Testes Unitários
```typescript
// roles.guard.spec.ts
describe('RolesGuard', () => {
  it('should allow access if user has required role', () => { ... });
  it('should deny access if user lacks required role', () => { ... });
  it('should allow access if no roles are required', () => { ... });
});
```

---

## 🔍 Como Investigar Problemas

### Passo 1: Verificar o Admin no Database
```sql
SELECT id, email, role, "passwordHash" 
FROM "User" 
WHERE email = 'admin@test.com';
```

Se `role` != `'ADMIN'`, recriar admin:
```typescript
// No test setup
await prisma.user.create({
  data: {
    nome: 'Admin User',
    email: 'admin@test.com',
    passwordHash: await bcrypt.hash('admin123', 10),
    role: 'ADMIN',  // ✅ ADMIN, não USER
    userRole: 'cliente'
  }
});
```

### Passo 2: Verificar Token Gerado
```typescript
// test/user-registration-flow.e2e-spec.ts
const loginResponse = await request(app.getHttpServer())
  .post('/auth/login')
  .send({ email: 'admin@test.com', password: 'admin123' });

console.log('Login response:', JSON.stringify(loginResponse.body, null, 2));

// Decodificar token
const token = loginResponse.body.accessToken;
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
console.log('Token payload:', payload);
// Deve ter: { sub, email, role: 'ADMIN', iat, exp }
```

### Passo 3: Testar Guards Isoladamente
```typescript
// roles.guard.spec.ts
it('should allow ADMIN role', () => {
  const mockExecutionContext = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role: 'ADMIN' } })
    })
  };
  
  const mockReflector = {
    getAllAndOverride: () => [Role.ADMIN]
  };
  
  const guard = new RolesGuard(mockReflector as any);
  expect(guard.canActivate(mockExecutionContext as any)).toBe(true);
});
```

---

## 📚 Recursos Adicionais

- [NestJS Guards](https://docs.nestjs.com/guards)
- [Passport JWT](http://www.passportjs.org/packages/passport-jwt/)
- [Supertest](https://github.com/ladjs/supertest#readme)
- [JWT.io Debugger](https://jwt.io/)

---

**Última atualização**: 9 de fevereiro de 2026
