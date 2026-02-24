# ADR: Gestao de Administradores e Bloqueio de Usuarios

**Data**: 2026-02-23  
**Status**: APROVADO  
**Autor**: Arquiteto do Sistema

---

## Contexto

O sistema hoje so permite criar admins via seed do Prisma ou manipulacao direta do banco de dados. Isso significa que:

- O cliente (dono da imobiliaria) depende do time tecnico para promover alguem a admin
- Nao existe forma de listar usuarios pelo painel
- Nao existe forma de bloquear usuarios problematicos
- Nao existe auditoria de quem fez o que

Isso nao escala e cria dependencia operacional inaceitavel.

---

## Decisoes Arquiteturais

### Principios

- Clean Architecture: Domain -> Application -> Infrastructure -> Interfaces
- Somente ADMIN pode executar essas operacoes
- Auditoria formal em tabela dedicada (quem fez o que, quando)
- Protecao contra cenarios destrutivos (ultimo admin, auto-rebaixamento)

### Escopo

| Funcionalidade | Descricao |
|----------------|-----------|
| Listar usuarios | Admin ve todos os usuarios do sistema |
| Promover a admin | Admin promove um USER para ADMIN |
| Bloquear usuario | Admin bloqueia um USER (impede login) |
| Desbloquear usuario | Admin desbloqueia um usuario bloqueado |
| Auditoria | Registro formal de todas as acoes administrativas |

### Fora do Escopo

- Rebaixar admin para user (nao solicitado)
- Alterar userRole (cliente/proprietario)
- Criar usuarios pelo admin (ja existe auto-registro)
- Admin bloquear outro admin

---

## Regras de Negocio

### RN-01: Promocao a Admin
- Somente usuarios com role ADMIN podem promover outros
- Somente usuarios com role USER podem ser promovidos
- Sem limite de quantidade de admins
- O sistema deve sempre manter pelo menos 1 admin ativo (relevante para futuro rebaixamento)

### RN-02: Bloqueio de Usuario
- Somente ADMIN pode bloquear
- Somente usuarios com role USER podem ser bloqueados (admin NAO pode bloquear outro admin)
- Usuario bloqueado eh barrado na autenticacao (login retorna erro)
- Token JWT do usuario bloqueado deve ser invalidado imediatamente (revogar refresh token)
- Existe desbloqueio (operacao reversa)

### RN-03: Auditoria
- Toda acao administrativa deve ser registrada
- Registro contem: quem executou, qual acao, sobre quem, quando
- Registros sao imutaveis (somente insercao, nunca atualizacao/delecao)

---

## Contratos Conceituais

### 1. Listar Usuarios

```
ENDPOINT: GET /admin/users
AUTORIZACAO: ADMIN
QUERY PARAMS (opcionais):
  - page: numero da pagina (default 1)
  - limit: itens por pagina (default 20)
  - role: filtrar por role (ADMIN | USER)
  - status: filtrar por status (active | blocked)
  - search: busca por nome ou email

RESPOSTA 200:
  data: [
    {
      id, nome, email, role, userRole,
      status (active | blocked),
      createdAt
    }
  ]
  meta: { total, page, limit, totalPages }

ERROS:
  401 - Nao autenticado
  403 - Sem permissao (nao eh admin)
```

### 2. Promover a Admin

```
ENDPOINT: PATCH /admin/users/:userId/promote
AUTORIZACAO: ADMIN

RESPOSTA 200:
  { id, nome, email, role: "ADMIN", message: "Usuario promovido a admin" }

REGRAS:
  - Usuario deve existir
  - Usuario deve ter role USER (se ja for ADMIN, retorna erro)
  - Usuario nao pode estar bloqueado
  - Registrar na auditoria

ERROS:
  401 - Nao autenticado
  403 - Sem permissao
  404 - Usuario nao encontrado
  409 - Usuario ja eh admin
  422 - Usuario esta bloqueado
```

### 3. Bloquear Usuario

```
ENDPOINT: PATCH /admin/users/:userId/block
AUTORIZACAO: ADMIN

RESPOSTA 200:
  { id, nome, email, status: "blocked", message: "Usuario bloqueado" }

REGRAS:
  - Usuario deve existir
  - Usuario deve ter role USER (admin nao pode ser bloqueado)
  - Usuario nao pode ja estar bloqueado
  - Invalidar refresh token imediatamente
  - Registrar na auditoria

ERROS:
  401 - Nao autenticado
  403 - Sem permissao
  404 - Usuario nao encontrado
  409 - Usuario ja esta bloqueado
  422 - Nao eh possivel bloquear um admin
```

### 4. Desbloquear Usuario

```
ENDPOINT: PATCH /admin/users/:userId/unblock
AUTORIZACAO: ADMIN

RESPOSTA 200:
  { id, nome, email, status: "active", message: "Usuario desbloqueado" }

REGRAS:
  - Usuario deve existir
  - Usuario deve estar bloqueado
  - Registrar na auditoria

ERROS:
  401 - Nao autenticado
  403 - Sem permissao
  404 - Usuario nao encontrado
  409 - Usuario nao esta bloqueado
```

---

## Modelo de Dados Conceitual

### Alteracoes na entidade User

```
User (campos novos):
  - status: enum (ACTIVE | BLOCKED), default ACTIVE
```

### Nova entidade: AdminAuditLog

```
AdminAuditLog:
  - id: identificador unico
  - adminId: referencia ao admin que executou a acao
  - targetUserId: referencia ao usuario afetado
  - action: enum (PROMOTE_TO_ADMIN | BLOCK_USER | UNBLOCK_USER)
  - details: texto opcional (contexto adicional)
  - createdAt: timestamp da acao

REGRAS:
  - Somente insercao (imutavel)
  - Indices em: adminId, targetUserId, action, createdAt
```

---

## Impacto no Login (Bloqueio)

O fluxo de login precisa ser alterado:

```
FLUXO ATUAL:
  1. Recebe email + senha
  2. Busca usuario por email
  3. Valida senha
  4. Gera tokens
  5. Retorna tokens

FLUXO NOVO:
  1. Recebe email + senha
  2. Busca usuario por email
  3. >>> NOVO: Verifica se status == BLOCKED -> retorna 403 "Conta bloqueada"
  4. Valida senha
  5. Gera tokens
  6. Retorna tokens
```

A verificacao de bloqueio deve acontecer ANTES da validacao de senha para evitar processamento desnecessario.

---

## Estrutura de Diretorios Sugerida

```
prisma/
  migrations/
    YYYYMMDDHHMMSS_add_user_status_and_audit_log/
      migration.sql

src/
  domain/
    entities/
      user.ts                          (ATUALIZAR: adicionar status, metodos block/unblock)
      admin-audit-log.ts               (NOVO)

  application/
    ports/
      user-repository.ts               (ATUALIZAR: novos metodos de query)
      admin-audit-log-repository.ts     (NOVO)

    use-cases/
      admin/
        list-users.use-case.ts          (NOVO)
        promote-to-admin.use-case.ts    (NOVO)
        block-user.use-case.ts          (NOVO)
        unblock-user.use-case.ts        (NOVO)

  interfaces/
    http/
      admin.controller.ts              (NOVO)
      dto/
        list-users-query.dto.ts        (NOVO)
        admin-action-response.dto.ts   (NOVO)

  infrastructure/
    database/
      prisma-admin-audit-log.repository.ts  (NOVO)
```

---

## Checklist de Implementacao

### Fase 1: Schema e Migracao
- [ ] Adicionar campo `status` (ACTIVE/BLOCKED) na tabela User com default ACTIVE
- [ ] Criar tabela AdminAuditLog
- [ ] Rodar migracao

### Fase 2: Domain
- [ ] Atualizar entidade User (campo status, metodos block/unblock)
- [ ] Criar entidade AdminAuditLog
- [ ] Testes unitarios das entidades

### Fase 3: Application (Use Cases)
- [ ] Criar port AdminAuditLogRepository
- [ ] Atualizar port UserRepository (novos metodos: findAll com filtros, count)
- [ ] Criar ListUsersUseCase
- [ ] Criar PromoteToAdminUseCase
- [ ] Criar BlockUserUseCase
- [ ] Criar UnblockUserUseCase
- [ ] Testes unitarios de todos os use cases
- [ ] Alterar fluxo de login para verificar status BLOCKED

### Fase 4: Infrastructure
- [ ] Implementar PrismaAdminAuditLogRepository
- [ ] Atualizar PrismaUserRepository (novos metodos)
- [ ] Testes do repository

### Fase 5: Interface HTTP
- [ ] Criar AdminController com todos os endpoints
- [ ] Criar DTOs (query, response)
- [ ] Documentar no Swagger
- [ ] Criar modulo Admin e registrar dependencias

### Fase 6: Testes E2E
- [ ] Teste: listar usuarios (com filtros e paginacao)
- [ ] Teste: promover usuario a admin
- [ ] Teste: tentar promover quem ja eh admin (409)
- [ ] Teste: tentar promover usuario bloqueado (422)
- [ ] Teste: bloquear usuario
- [ ] Teste: tentar bloquear admin (422)
- [ ] Teste: tentar bloquear quem ja esta bloqueado (409)
- [ ] Teste: desbloquear usuario
- [ ] Teste: usuario bloqueado tenta fazer login (403)
- [ ] Teste: verificar registros de auditoria criados
- [ ] Teste: endpoints sem autenticacao (401)
- [ ] Teste: endpoints com usuario nao-admin (403)

---

## Decisoes Rejeitadas

| Alternativa | Motivo da Rejeicao |
|-------------|-------------------|
| Rebaixar admin para user | Nao solicitado pelo negocio. Pode ser adicionado no futuro. |
| Admin bloquear outro admin | Risco de lockout total. Bloqueio restrito a users. |
| Soft delete em vez de bloqueio | Bloqueio eh reversivel, soft delete implica exclusao. Semanticas diferentes. |
| Auditoria em log de aplicacao | Logs de aplicacao sao efemeros e dificeis de consultar. Tabela dedicada garante persistencia e consulta futura. |
| Enviar notificacao ao usuario bloqueado/promovido | Fora do escopo. Pode ser adicionado depois (mesmo padrao do password reset sem email). |

---

## Notas para o Dev

1. **Siga o padrao existente**: o projeto ja usa Clean Architecture com ports/adapters, entidades imutaveis, e injecao de dependencia via tokens. Siga o mesmo padrao.

2. **TDD**: escreva os testes unitarios dos use cases ANTES da implementacao.

3. **Guard de bloqueio no login**: a verificacao de `status == BLOCKED` deve ficar no `LoginUseCase`, nao no controller. Mantenha a logica de negocio na camada de aplicacao.

4. **Invalidacao imediata ao bloquear**: ao bloquear, faca `updateRefreshToken(userId, null)` para invalidar a sessao. O access token vai expirar naturalmente (max 1 dia conforme config atual).

5. **Auditoria dentro da mesma transacao**: a criacao do log de auditoria deve acontecer na mesma transacao que a acao (promote/block/unblock) para garantir consistencia. Se a acao falha, a auditoria tambem nao eh gravada.

---

## Revisao de Implementacao (2026-02-23)

### Status Geral: ✅ APROVADO (2026-02-23)

---

### O que esta correto

| Item | Status |
|------|--------|
| Schema e Migracao (campo status, tabela AdminAuditLog, indices) | OK |
| Entidade User (campo status, metodos block/unblock/promoteToAdmin, getters isBlocked/isAdmin) | OK |
| Entidade AdminAuditLog (campos readonly, tipo AdminActionType) | OK |
| Port AdminAuditLogRepository | OK |
| Port UserRepository (findAll com filtros, ListUsersFilters, ListUsersResult) | OK |
| ListUsersUseCase (sanitizacao de page/limit, delegacao ao repository) | OK |
| PromoteToAdminUseCase (valida existencia, role, bloqueio) | OK |
| BlockUserUseCase (valida existencia, role, bloqueio, invalida refresh token) | OK |
| UnblockUserUseCase (valida existencia, status bloqueado) | OK |
| Testes unitarios dos 4 use cases (admin-use-cases.spec.ts) | OK |
| Login barra usuario bloqueado ANTES de validar senha (LoginUseCase linhas 44-47) | OK |
| AdminController com 4 endpoints, guards, mapeamento de erros | OK |
| DTOs (ListUsersQueryDto, AdminActionResponseDto e variantes) | OK |
| Swagger documentado com ApiTags, ApiBearerAuth, ApiOperation, ApiResponse | OK |
| AdminModule registrado no AppModule | OK |
| AuthService trata UserBlockedError como ForbiddenException (403) | OK |

---

### Pendencias — PRIORIDADE ALTA

#### 1. Auditoria fora de transacao

**Problema**: Os use cases (promote, block, unblock) fazem `save()` e `auditLogRepository.create()` como chamadas separadas, sem transacao. Se a auditoria falhar, a acao ja foi persistida sem registro.

**O ADR exige (Nota 5)**: "a criacao do log de auditoria deve acontecer na mesma transacao que a acao"

**O projeto ja usa esse padrao em**:
- `prisma-people.repository.ts`
- `create-anuncio-with-images.use-case.ts`

**O que fazer**: Encapsular `save()` + `auditLogRepository.create()` em uma unica transacao. Existem duas abordagens:
- Criar um metodo no repository que receba ambas as operacoes em `$transaction`
- Ou injetar o PrismaService no use case e usar `prisma.$transaction()` diretamente (menos limpo, mas funcional)

A primeira abordagem eh preferivel para manter o padrao clean architecture.

#### 2. Testes E2E — nenhum foi criado

**O ADR define 12 cenarios E2E obrigatorios**. Nenhum existe.

Criar arquivo `test/admin-management.e2e-spec.ts` com:

```
Cenarios obrigatorios:
  - Listar usuarios (com filtros e paginacao)
  - Promover usuario a admin
  - Tentar promover quem ja eh admin (409)
  - Tentar promover usuario bloqueado (422)
  - Bloquear usuario
  - Tentar bloquear admin (422)
  - Tentar bloquear quem ja esta bloqueado (409)
  - Desbloquear usuario
  - Usuario bloqueado tenta fazer login (403)
  - Verificar registros de auditoria criados
  - Endpoints sem autenticacao (401)
  - Endpoints com usuario nao-admin (403)
```

---

### Pendencias — PRIORIDADE MEDIA

#### 3. Testes unitarios da entidade User (metodos novos)

**Problema**: `src/domain/entities/user.spec.ts` NAO testa os metodos novos.

**O que falta testar**:
- `block()` retorna nova instancia com status BLOCKED
- `unblock()` retorna nova instancia com status ACTIVE
- `promoteToAdmin()` retorna nova instancia com role ADMIN
- `isBlocked` retorna true quando status eh BLOCKED
- `isBlocked` retorna false quando status eh ACTIVE
- `isAdmin` retorna true quando role eh ADMIN
- `isAdmin` retorna false quando role eh USER
- Imutabilidade: instancia original nao eh alterada

#### 4. Testes do repository (novos metodos)

**Problema**: `src/infrastructure/database/prisma-user.repository.spec.ts` NAO cobre `findAll()` nem `save()` com status/role.

**O que falta testar**:
- `findAll()` sem filtros retorna todos os usuarios paginados
- `findAll()` com filtro de role
- `findAll()` com filtro de status
- `findAll()` com search (busca por nome e email, case-insensitive)
- `findAll()` com paginacao (page, limit, totalPages)
- `save()` persiste status corretamente

---

### Pendencias — PRIORIDADE BAIXA

#### 5. Spec da entidade AdminAuditLog

**Problema**: NAO existe `src/domain/entities/admin-audit-log.spec.ts`.

**O que testar**:
- Criacao com todos os campos
- Campos sao readonly (imutabilidade)

---

### Checklist de Resolucao

O dev deve resolver na seguinte ordem:

- [x] ALTA: Auditoria dentro de transacao nos 3 use cases (promote, block, unblock)
- [x] ALTA: Testes E2E (12 cenarios em test/admin-management.e2e-spec.ts)
- [x] MEDIA: Testes unitarios dos metodos novos da entidade User
- [x] MEDIA: Testes do repository (findAll, save com status)
- [x] BAIXA: Spec da entidade AdminAuditLog

**Todas as pendencias resolvidas. ADR APROVADO.**
