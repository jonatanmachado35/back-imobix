# Documento Técnico: Correção de Inconsistência de Dados na Autenticação

## Problema Identificado

Existe uma inconsistência semântica nos dados retornados pelos endpoints de autenticação que está gerando confusão no frontend e possivelmente causando bugs na aplicação.

### Situação Atual

| Endpoint | Campo Retornado | Valor Possible | Origem no Banco |
|----------|----------------|----------------|-----------------|
| `POST /auth/login` | `user.role` | `ADMIN` ou `USER` | Campo `role` da tabela User |
| `GET /users/me` | `role` | `cliente` ou `proprietario` | Campo `userRole` da tabela User |

### Por que isso é um problema?

1. **Admin faz login** → `/auth/login` retorna `role: "ADMIN"`
2. **Admin chama /users/me** → retorna `role: "cliente"` (valor default do campo `userRole`)

Isso não faz sentido semanticamente. Se o usuário é admin, ele deve aparecer como admin em todos os endpoints.

### Modelo de Dados (schema.prisma)

```prisma
model User {
  id           String   @id @default(cuid())
  nome         String
  email        String   @unique
  passwordHash String
  role         Role     @default(USER)       // ADMIN | USER - permissão de SISTEMA
  userRole     String?  @default("cliente")  // cliente | proprietario - tipo de NEGÓCIO
  
  // ...outros campos
}
```

Dois conceitos diferentes estão sendo misturados:
- `role` = permissão de sistema (quem pode acessar o painel admin)
- `userRole` = tipo de usuário no negócio (cliente aluga, proprietário aluga/imobix)

---

## Correções Necessárias

### 1. Padronizar resposta do `/auth/login`

**Arquivo:** `src/application/use-cases/login.use-case.ts`

**Atual:**
```typescript
return {
  accessToken,
  user: {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role  // ❌ Retorna "ADMIN" ou "USER"
  }
};
```

**Modificar para:**
```typescript
return {
  accessToken,
  user: {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,           // Permissão de sistema: ADMIN | USER
    userType: user.userRole || 'cliente'  // Tipo de negócio: cliente | proprietario
  }
};
```

---

### 2. Padronizar resposta do `/users/me`

**Arquivo:** `src/application/use-cases/get-user-profile.use-case.ts`

**Atual:**
```typescript
return {
  id: user.id,
  name: user.nome,
  email: user.email,
  phone: user.phone ?? null,
  avatar: user.avatar ?? null,
  role: user.userRole ?? 'cliente',  // ❌ Usa userRole como "role"
};
```

**Modificar para:**
```typescript
return {
  id: user.id,
  name: user.nome,
  email: user.email,
  phone: user.phone ?? null,
  avatar: user.avatar ?? null,
  role: user.role,                    // Permissão de sistema: ADMIN | USER
  userType: user.userRole || 'cliente' // Tipo de negócio: cliente | proprietario
};
```

---

### 3. Atualizar DTOs do Swagger

**Arquivo:** `src/auth/dto/login-response.dto.ts`

**Atual:**
```typescript
export class LoginResponseDto {
  @ApiProperty({ 
    description: 'Token JWT para autenticação', 
    example: 'eyJhbGci...' 
  })
  access_token: string;
}
```

**Modificar para:**
```typescript
export class LoginResponseDto {
  @ApiProperty({ 
    description: 'Token JWT para autenticação', 
    example: 'eyJhbGci...' 
  })
  access_token: string;

  @ApiProperty({ 
    description: 'Dados do usuário autenticado',
    type: UserInfoDto 
  })
  user: UserInfoDto;
}

export class UserInfoDto {
  @ApiProperty({ description: 'ID do usuário', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Nome completo', example: 'Maria Silva' })
  nome: string;

  @ApiProperty({ description: 'Email', example: 'maria@example.com' })
  email: string;

  @ApiProperty({ 
    description: 'Permissão de sistema', 
    example: 'ADMIN', 
    enum: ['ADMIN', 'USER'] 
  })
  role: string;

  @ApiProperty({ 
    description: 'Tipo de usuário no negócio', 
    example: 'cliente', 
    enum: ['cliente', 'proprietario'] 
  })
  userType: string;
}
```

---

**Arquivo:** `src/interfaces/http/dto/user-response.dto.ts`

Adicionar o campo `userType`:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'ID do usuário', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Nome completo do usuário', example: 'Maria Silva' })
  nome: string;

  @ApiProperty({ description: 'Email do usuário', example: 'maria@example.com' })
  email: string;

  @ApiProperty({ 
    description: 'Permissão de sistema', 
    example: 'USER', 
    enum: ['ADMIN', 'USER'] 
  })
  role: string;

  @ApiProperty({ 
    description: 'Tipo de usuário no negócio', 
    example: 'cliente', 
    enum: ['cliente', 'proprietario'] 
  })
  userType: string;

  @ApiProperty({ description: 'Data de criação', example: '2026-01-25T18:00:00.000Z' })
  createdAt: Date;
}
```

---

### 4. Verificar outros endpoints que retornam dados do usuário

Garantir que todos os endpoints que retornam dados do usuário sigam o mesmo padrão:
- `role` = ADMIN | USER (permissão de sistema)
- `userType` = cliente | proprietario (tipo de negócio)

Verificar especialmente:
- `POST /users` (criação)
- `PATCH /users/me` (atualização)
- Qualquer outro endpoint que retorne `User` ou dados do usuário logado

---

## Resultado Esperado

### Após as correções:

**`POST /auth/login`**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "clxyz123",
    "nome": "João Admin",
    "email": "admin@imobix.com",
    "role": "ADMIN",
    "userType": "proprietario"
  }
}
```

**`GET /users/me`**
```json
{
  "id": "clxyz123",
  "nome": "João Admin",
  "email": "admin@imobix.com",
  "role": "ADMIN",
  "userType": "proprietario",
  "phone": null,
  "avatar": null,
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

---

## Regras de Negócio a Considerar

1. **Admin sempre é admin** - Um usuário com `role: ADMIN` deve aparecer como ADMIN em todos os endpoints, independente do `userType`

2. **Usuário comum pode ser cliente ou proprietário** - Um usuário com `role: USER` pode ter `userType: cliente` ou `userType: proprietario`

3. **Front-end usará os campos assim:**
   - `role` = para bloquear/acessar funcionalidades de ADMIN (painel admin, gestão de usuários)
   - `userType` = para definir o fluxo da aplicação (cliente = busca/aluga, proprietário = gerencia imóveis)

---

## Testes a Executar

1. Criar usuário admin → verificar que `role: "ADMIN"` e `userType` pode ser qualquer valor
2. Criar usuário comum como cliente → verificar `role: "USER"` e `userType: "cliente"`
3. Criar usuário comum como proprietário → verificar `role: "USER"` e `userType: "proprietario"`
4. Fazer login como admin → verificar resposta inclui `role` e `userType`
5. Chamar `/users/me` como admin → verificar que `role` continua sendo "ADMIN" (não "cliente")

---

## Referência

- Schema: `prisma/schema.prisma` linhas 89-117 (model User)
- Login UseCase: `src/application/use-cases/login.use-case.ts`
- GetUserProfile UseCase: `src/application/use-cases/get-user-profile.use-case.ts`
- Auth Controller: `src/auth/auth.controller.ts`
- Users Controller: `src/interfaces/http/users.controller.ts`
