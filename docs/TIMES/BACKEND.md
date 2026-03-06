# Guia de Implementação — Dev Backend
**Projeto:** Imobix Painel Web  
**Data:** 2026-03-05  
**Destinatário:** Time de Backend  
**Origem:** Arquitetura (ADR-001 ao ADR-006) + análise do código atual

> Este documento descreve **o que precisa ser implementado**, **o que precisa ser corrigido** e **os contratos exatos** esperados pelo frontend.  
> Leia os ADRs referenciados antes de implementar qualquer item.

---

## 1. Situação atual do backend (diagnóstico)

| Módulo | Situação |
|--------|----------|
| Autenticação (login, logout, refresh, change-password) | ✅ Implementado |
| Gestão de usuários (`/admin/users`) | ✅ Implementado |
| Imóveis (`/proprietario/properties`, `/properties`) | ✅ Implementado |
| Upload de imagens (Cloudinary) | ✅ Implementado |
| Reservas (`/bookings`, `/proprietario/bookings`) | ✅ Implementado |
| Chat (`/conversations`) | ✅ Implementado |
| Funcionários (`/funcionarios`) | ✅ Implementado |
| Corretores (`/corretores`) | ✅ Implementado |
| **Multi-tenancy real** | ❌ Não implementado |
| **Role `SUPER_ADMIN`** | ❌ Não implementado |
| **Branding por tenant** (`/configuracoes/painel`) | ❌ Não implementado |
| **Campo `primeiroAcesso`** no login | ❌ Não implementado |
| **Endpoints `/super-admin/tenants`** | ❌ Não implementado |

---

## 2. Correções prioritárias (sem novas features)

### 2.1 Campo `primeiroAcesso` na resposta do login

**Referência:** ADR-006, seção 3 — Autenticação  
**Prioridade:** 🔴 Alta  
**Tipo de mudança:** Non-breaking (adição de campo opcional)

O frontend precisa saber se um usuário Admin acabou de ser criado e precisa configurar o painel antes de usá-lo.

**O que implementar:**

1. Adicionar campo `primeiroAcesso: boolean` ao modelo `User` no Prisma
2. Retornar `primeiroAcesso` na resposta do `POST /auth/login`
3. Criar endpoint para marcar como concluído:

```
PATCH /users/me
Body: { "primeiroAcesso": false }
```

**Regras de negócio:**
- `primeiroAcesso: true` → apenas para admins recém-criados via Super Admin
- `primeiroAcesso: false` → usuários comuns, usuários existentes, Admin Global
- Após o onboarding, o frontend chama `PATCH /users/me` com `{ primeiroAcesso: false }`

**Contrato esperado na resposta do login:**
```json
{
  "access_token": "<JWT>",
  "user": {
    "id": "...",
    "nome": "...",
    "email": "...",
    "role": "ADMIN",
    "userType": "proprietario",
    "primeiroAcesso": false
  }
}
```

---

### 2.2 Divergência no campo `name` vs `nome` no PATCH /users/me

**Prioridade:** 🟡 Média  
**Tipo de mudança:** Non-breaking (melhoria de consistência)

O `PATCH /users/me` atualmente aceita `name` (inglês), mas o resto da API usa `nome` (português).

**Decisão:** Aceitar ambos por compatibilidade, ou alinhar com o frontend qual padrão usar. Documentar a decisão no Swagger.

---

## 3. Branding por Tenant — `/configuracoes/painel`

**Referência:** ADR-004 — Branding e Contrato Público  
**Prioridade:** 🔴 Alta (Fase 2 do roadmap)

### 3.1 O que implementar

Dois endpoints:

#### GET /configuracoes/painel (público, sem autenticação)

Retorna a identidade visual do tenant. **Não requer token.**

```json
{
  "nomePainel": "Imobiliária Beira Mar",
  "subtitulo": "Aluguel por temporada",
  "corPrimaria": "#2563EB",
  "corSidebar": "#1E3A5F",
  "logoUrl": "https://storage.exemplo.com/logo-beira-mar.png"
}
```

**Regras obrigatórias:**
- Se o tenant não tiver branding configurado → retornar os valores padrão da plataforma Imobix (não retornar erro)
- Nunca expor dados sensíveis (tokens, IDs de usuários, etc.)
- Identificar o tenant pelo subdomínio ou por um parâmetro de query (ex: `?tenant=beira-mar`) — **decisão a definir com o time**

#### PUT /configuracoes/painel (autenticado, apenas ADMIN)

```json
{
  "nomePainel": "Imobiliária Beira Mar",
  "subtitulo": "Aluguel por temporada",
  "corPrimaria": "#2563EB",
  "corSidebar": "#1E3A5F"
}
```

**Regras obrigatórias:**
- Apenas `role: ADMIN` pode alterar
- O tenant é derivado do JWT — o admin só altera o branding do próprio tenant
- Persistir no banco (não aceitar salvar apenas em memória)

#### POST /configuracoes/painel/logo (autenticado, apenas ADMIN)

Upload do arquivo de logo. Formato `multipart/form-data`.

```
file: <arquivo>   (obrigatório, máx 2MB, JPEG/PNG/SVG)
```

**Resposta:**
```json
{
  "logoUrl": "https://storage.exemplo.com/logo-beira-mar.png"
}
```

> ⚠️ **Decisão pendente:** onde armazenar os arquivos de logo? Cloudinary (já usado para imóveis) ou outro storage? Definir antes de implementar.

### 3.2 Schema Prisma sugerido

```prisma
model TenantBranding {
  id          String  @id @default(cuid())
  tenantId    String  @unique
  nomePainel  String  @default("Imobix")
  subtitulo   String  @default("Gestão de Temporada")
  corPrimaria String  @default("#2563EB")
  corSidebar  String  @default("#1E3A5F")
  logoUrl     String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 4. Super Admin — Role e Endpoints

**Referência:** ADR-003 — Governança do Super Admin  
**Prioridade:** 🔴 Alta (Fase 3 do roadmap)

### 4.1 O que implementar

#### 4.1.1 Role SUPER_ADMIN no banco

Adicionar `SUPER_ADMIN` ao enum `Role` no Prisma:

```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  USER
}
```

> ⚠️ Esta é uma **mudança breaking** no schema. Requer migration cuidadosa. Testar com dados existentes.

#### 4.1.2 Endpoint de gestão de tenants

> ⚠️ **DECISÃO PENDENTE antes de implementar:** hard-delete ou soft-delete para remoção de tenant? Impacto em LGPD. Consulte o PO antes de criar o `DELETE`.

```
GET    /super-admin/tenants              → lista todos os tenants
POST   /super-admin/tenants              → cria novo tenant
GET    /super-admin/tenants/:id          → detalhe de um tenant
PATCH  /super-admin/tenants/:id          → edita dados do tenant
PATCH  /super-admin/tenants/:id/suspend  → suspende tenant
PATCH  /super-admin/tenants/:id/reactivate → reativa tenant
DELETE /super-admin/tenants/:id          → remove tenant (⚠️ decidir política)
```

**Todos os endpoints exigem `role: SUPER_ADMIN`.**

#### 4.1.3 Contratos esperados

**GET /super-admin/tenants — Resposta:**
```json
{
  "data": [
    {
      "id": "...",
      "nome": "Imobiliária Beira Mar",
      "plano": "PRO",
      "status": "ATIVO",
      "adminEmail": "admin@beira-mar.com",
      "totalUsuarios": 5,
      "totalImoveis": 12,
      "criadoEm": "2026-01-15T00:00:00Z"
    }
  ],
  "meta": { "total": 10, "page": 1, "limit": 20 }
}
```

**POST /super-admin/tenants — Body:**
```json
{
  "nome": "Imobiliária Nova",
  "plano": "BASICO",
  "adminNome": "Carlos Souza",
  "adminEmail": "carlos@imob-nova.com",
  "adminSenha": "senha-temporaria-123"
}
```

**Efeito colateral obrigatório ao criar tenant:**
1. Criar o registro do tenant
2. Criar o usuário Admin do tenant com `primeiroAcesso: true`
3. Registrar na trilha de auditoria: quem criou, quando, qual tenant

**PATCH /super-admin/tenants/:id/suspend — Efeito:**
- Marcar tenant como `SUSPENSO`
- **Bloquear imediatamente o login de todos os usuários** daquele tenant
- Registrar na trilha de auditoria

#### 4.1.4 Auditoria obrigatória

Para toda ação de escrita do Super Admin, registrar:

```prisma
model SuperAdminAuditLog {
  id           String   @id @default(cuid())
  adminId      String
  acao         String   // "CRIAR_TENANT", "SUSPENDER_TENANT", etc.
  tenantId     String?
  detalhes     String?
  criadoEm     DateTime @default(now())
}
```

---

## 5. Multi-Tenancy — Isolamento de dados

**Referência:** ADR-001 — Multi-Tenancy e Isolamento  
**Prioridade:** 🔴 Alta (base de tudo)

### 5.1 Situação atual

O backend **não tem `tenantId` no modelo de dados**. Todos os usuários, imóveis e reservas coexistem em uma única tabela sem segregação.

### 5.2 O que precisa ser feito

1. **Criar modelo `Tenant`** no schema Prisma:

```prisma
enum TenantStatus {
  ATIVO
  SUSPENSO
  REMOVIDO
}

enum Plano {
  BASICO
  PRO
  ENTERPRISE
}

model Tenant {
  id        String       @id @default(cuid())
  nome      String
  status    TenantStatus @default(ATIVO)
  plano     Plano        @default(BASICO)
  
  users     User[]
  branding  TenantBranding?
  
  criadoEm  DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}
```

2. **Adicionar `tenantId` ao modelo `User`:**

```prisma
model User {
  // ... campos existentes ...
  tenantId  String?
  tenant    Tenant? @relation(fields: [tenantId], references: [id])
}
```

3. **Propagar `tenantId` para todos os recursos do tenant** (Property, Booking, Funcionario, etc.)

4. **Todo endpoint autenticado deve filtrar pelo tenant do usuário logado:**
   - O `tenantId` é derivado do payload JWT — nunca aceito como parâmetro do cliente
   - Um usuário com `role: ADMIN` só vê dados do próprio tenant
   - Apenas `SUPER_ADMIN` pode cruzar fronteiras de tenant

5. **Suspensão de tenant bloqueia login:**
   - Ao fazer login, verificar se `user.tenant.status === 'SUSPENSO'`
   - Se sim, retornar `403 Forbidden` com mensagem `"Conta suspensa. Entre em contato com o suporte."`

> ⚠️ Esta é a **mudança de maior impacto** em todo o backend. Requer planejamento de migration cuidadoso para não quebrar dados existentes.

---

## 6. Divergências a corrigir (sem novas features)

| # | Divergência | Ação necessária | Prioridade |
|---|-------------|-----------------|-----------|
| 1 | Path `/proprietario/properties` correto, frontend usa `/anuncios` | Apenas documentar — frontend corrige o lado deles | Já feito |
| 2 | `PATCH /users/me` usa `name` (EN), padrão da API é `nome` (PT) | Aceitar ambos OU atualizar e comunicar ao frontend | Média |
| 3 | Resposta do login sem `primeiroAcesso` | Adicionar campo (seção 2.1) | Alta |
| 4 | `Role` enum sem `SUPER_ADMIN` | Adicionar ao enum (seção 4.1.1) | Alta |
| 5 | Sem filtragem por tenant em nenhum endpoint | Implementar multi-tenancy (seção 5) | Alta |

---

## 7. Regras de governança de contratos

**Referência:** ADR-005 — Governança de Contratos de Integração

**Você é o dono do contrato.** Ao alterar qualquer endpoint ou DTO:

1. **Mudança non-breaking** (adicionar campo opcional): pode fazer a qualquer momento, mas **avisar o frontend no mesmo dia**
2. **Mudança breaking** (remover campo, renomear, mudar tipo): comunicar com **pelo menos 1 sprint de antecedência** e manter a versão antiga por 1 ciclo
3. **Novo endpoint**: documentar no Swagger **antes** do frontend integrar
4. O Swagger é a **fonte de verdade** — deve estar sempre atualizado antes do merge

**Mudanças breaking identificadas neste documento:**
- Adicionar `SUPER_ADMIN` ao enum `Role` → avisar frontend antes de ir para produção
- Adicionar `tenantId` nos modelos → migration cuidadosa, não quebra a API mas muda o comportamento

---

## 8. Roadmap de implementação recomendado

### Fase 1 — Correções (sem migration de banco)
- [ ] Adicionar `primeiroAcesso` ao `User` e à resposta do login
- [ ] Aceitar `primeiroAcesso: false` no `PATCH /users/me`
- [ ] Corrigir inconsistência `name` vs `nome` no `PATCH /users/me`
- [ ] Garantir que `POST /auth/refresh-token` está funcional (já existe)

### Fase 2 — Branding
- [ ] Criar modelo `TenantBranding` no Prisma
- [ ] Criar `GET /configuracoes/painel` (público, com fallback)
- [ ] Criar `PUT /configuracoes/painel` (autenticado, ADMIN)
- [ ] Criar `POST /configuracoes/painel/logo` (upload, após decisão de storage)

### Fase 3 — Super Admin e Multi-Tenancy
- [ ] Criar modelo `Tenant` no Prisma
- [ ] Adicionar `tenantId` ao `User` e demais modelos
- [ ] Adicionar `SUPER_ADMIN` ao enum `Role`
- [ ] Criar endpoints `/super-admin/tenants`
- [ ] Implementar auditoria de ações do Super Admin
- [ ] Implementar bloqueio de login por status de tenant
- [ ] Propagar filtro de `tenantId` em todos os endpoints

### Fase 4 — Expansão (aguarda decisão do PO)
- [ ] Leads (endpoints `/leads`)
- [ ] Integração de métricas avançadas
- [ ] Chat no painel admin (já existe no backend, falta integração de UI)

---

## 9. Decisões pendentes (requerem resposta antes de implementar)

| # | Decisão | Impacto | Responsável |
|---|---------|---------|-------------|
| 1 | Remoção de tenant: hard-delete ou soft-delete? | Alto — LGPD, recuperação de dados | PO + Tech Lead |
| 2 | Como identificar o tenant no `GET /configuracoes/painel` público? (subdomínio, query param, header?) | Alto — define toda a estratégia de multi-tenancy | Tech Lead |
| 3 | Onde armazenar logos de tenant? (Cloudinary já usado? Storage separado?) | Médio | Tech Lead + DevOps |
| 4 | Impersonação de tenant pelo Super Admin: sim ou não? | Médio — segurança e auditoria | PO |
| 5 | Leads entram no produto? | Médio — define escopo | PO |
| 6 | LGPD: há requisitos nesta fase? | Alto — afeta política de deleção | PO + Jurídico |

---

## 10. Checklist de segurança por endpoint

Antes de cada endpoint entrar em produção, verificar:

- [ ] Requer autenticação? Guard `JwtAuthGuard` aplicado?
- [ ] Requer role específico? Guard `RolesGuard` + decorator `@Roles()` aplicado?
- [ ] Filtra por `tenantId` do usuário autenticado?
- [ ] Ação crítica? Registra na trilha de auditoria?
- [ ] Endpoint público? Não expõe dados sensíveis?
- [ ] Documentado no Swagger com exemplos de request e response?

---

*Documento gerado por: Tech Lead / Arquiteto*  
*Baseado em: ADR-001 ao ADR-006 + leitura do código real do backend*  
*Data: 2026-03-05*
