# Tenant — Criação e Gerenciamento

## Endpoint para criar um novo tenant

```
POST /super-admin/tenants
```

**Requer:** Bearer token de `SUPER_ADMIN`

---

## Fluxo completo

### 1. Login como Super Admin

```http
POST /auth/login
Content-Type: application/json

{
  "email": "superadmin@imobix.com",
  "password": "SuperAdmin@123"
}
```

Pegar o `access_token` da resposta.

---

### 2. Criar o tenant

```http
POST /super-admin/tenants
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "nome": "Imobiliária Beira Mar",
  "plano": "BASICO",
  "adminNome": "João Silva",
  "adminEmail": "joao@imobiliaria.com",
  "adminPassword": "Senha@123"
}
```

---

## Campos do body

| Campo           | Tipo                                  | Obrigatório | Descrição                          |
|-----------------|---------------------------------------|-------------|------------------------------------|
| `nome`          | string (max 200)                      | ✅          | Nome da imobiliária/empresa        |
| `plano`         | `BASICO` \| `PRO` \| `ENTERPRISE`     | ✅          | Plano contratado                   |
| `adminNome`     | string (max 200)                      | ✅          | Nome do usuário admin do tenant    |
| `adminEmail`    | string (e-mail válido)                | ✅          | E-mail de login do admin           |
| `adminPassword` | string (min 8 caracteres)             | ✅          | Senha inicial do admin             |

---

## Respostas

| Status | Descrição                                      |
|--------|------------------------------------------------|
| `201`  | Tenant e admin criados com sucesso             |
| `401`  | Token ausente ou inválido                      |
| `403`  | Usuário não é `SUPER_ADMIN`                    |
| `409`  | E-mail do admin já existe em outro tenant      |

---

## O que acontece por baixo

- Tenant criado com status `ATIVO`
- Admin criado com `tenantId` apontando para o novo tenant
- Admin recebe `primeiroAcesso: true` (onboarding obrigatório no primeiro login)
- Tudo em **transação atômica** — se o e-mail do admin já existir, nada é criado
- Ação registrada no `SuperAdminAuditLog`

---

## Demais endpoints de gerenciamento

Todos exigem Bearer token de `SUPER_ADMIN`.

| Método   | Endpoint                                  | Descrição                                                  |
|----------|-------------------------------------------|------------------------------------------------------------|
| `GET`    | `/super-admin/tenants`                    | Lista todos os tenants (paginado, com filtros)             |
| `GET`    | `/super-admin/tenants/:id`                | Detalhes de um tenant                                      |
| `POST`   | `/super-admin/tenants`                    | Criar novo tenant + admin                                  |
| `PATCH`  | `/super-admin/tenants/:id`                | Atualizar nome e/ou plano do tenant                        |
| `PATCH`  | `/super-admin/tenants/:id/suspend`        | Suspender tenant (invalida refresh tokens de todos os usuários) |
| `PATCH`  | `/super-admin/tenants/:id/reactivate`     | Reativar tenant suspenso                                   |
| `DELETE` | `/super-admin/tenants/:id`                | Soft-delete do tenant (status → `REMOVIDO`)                |

---

## Credenciais da seed (ambiente de desenvolvimento)

| Usuário      | E-mail                      | Senha           |
|--------------|-----------------------------|-----------------|
| SUPER_ADMIN  | `superadmin@imobix.com`     | `SuperAdmin@123` |
| ADMIN (demo) | `admin@imobix.com`          | `Admin@123`      |
