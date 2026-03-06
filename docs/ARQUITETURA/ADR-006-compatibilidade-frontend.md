# ADR-006 — Compatibilidade com Requisitos do Frontend

**Status:** Aprovado com ressalvas  
**Data:** 2026-03-05  
**Contexto:** Imobix Painel Web  
**Origem:** Documento enviado pelo Dev Frontend — "Backend: Requisitos White-Label + Super Admin"

---

## Contexto

O time de frontend enviou um documento descrevendo rotas, payloads e comportamentos esperados do backend para implementar:
- White-label por tenant (branding)
- Super Admin com gestão de tenants
- Onboarding de primeiro acesso

Este documento avalia se esses requisitos **ferem a arquitetura atual** ou podem ser incorporados com segurança.

---

## Conclusão Geral

> ✅ **Os requisitos do frontend são compatíveis com a arquitetura**, desde que as condições obrigatórias listadas abaixo sejam respeitadas.

Não há conflito estrutural — o documento do frontend descreve funcionalidades que **estão dentro das fronteiras de domínio definidas** nos ADRs anteriores.

O risco não é arquitetural. O risco é de **processo**: o frontend definiu contratos de forma unilateral. Esses contratos precisam ser validados e formalizados pelo backend antes de serem considerados definitivos.

---

## Análise por Área

### 1. White-Label / Branding

**Requisito do frontend:** `GET /configuracoes/painel` público + `PUT /configuracoes/painel` autenticado + upload de logo.

**Avaliação:** ✅ Compatível  
Está alinhado com o ADR-004 (Branding e Contrato Público).

**Condições obrigatórias:**
- Leitura pública não pode expor dados sensíveis
- Escrita restrita ao Admin do tenant (não a qualquer usuário)
- Fallback obrigatório quando branding não estiver configurado

---

### 2. Super Admin — Gestão de Tenants

**Requisito do frontend:** endpoints `/super-admin/tenants` com CRUD completo, role `SUPER_ADMIN`.

**Avaliação:** ✅ Compatível com ressalva  
Está alinhado com o ADR-003 (Governança do Super Admin).

**Condições obrigatórias:**
- Role `SUPER_ADMIN` deve ser implementado como entidade real no backend (não mock)
- Todas as ações de escrita devem ter auditoria
- Deleção de tenant precisa de decisão formal: hard-delete ou soft-delete (pendente — ver abaixo)
- Suspensão deve bloquear login de todos os usuários do tenant imediatamente

**Ressalva crítica:**
> A deleção permanente (`DELETE /super-admin/tenants/:id`) é uma operação de **alto risco**.  
> Não deve ser implementada sem decisão explícita do time sobre política de exclusão (LGPD, recuperação de dados, auditoria).

---

### 3. Autenticação — Campo `primeiroAcesso`

**Requisito do frontend:** adicionar `primeiroAcesso: boolean` na resposta do login.

**Avaliação:** ✅ Compatível — mudança non-breaking  
É uma adição de campo opcional que não quebra contratos existentes.

**Condições obrigatórias:**
- `primeiroAcesso: true` apenas para Admins recém-criados junto com o tenant
- `primeiroAcesso: false` para Admin Global (nunca passa pelo onboarding de tenant)
- Após onboarding, `PATCH /users/me` marca como `false` — campo deve ser persistido no backend

---

### 4. Isolamento de Dados por Tenant

**Requisito do frontend:** "O `tenantId` deve ser extraído do token JWT em todas as requisições."

**Avaliação:** ✅ Compatível  
Está alinhado com o ADR-001 (Multi-Tenancy e Isolamento).

**Condições obrigatórias:**
- Nenhum endpoint de domínio pode retornar dados sem filtro de tenant
- O tenant nunca é informado pelo cliente — sempre derivado do contexto de identidade

---

## O que FERE a arquitetura (pontos de atenção)

| # | Ponto | Risco | Ação Necessária |
|---|-------|-------|----------------|
| 1 | Frontend definiu contratos sem validação do backend | Processo | Validar cada contrato conforme ADR-005 |
| 2 | `DELETE /super-admin/tenants/:id` sem política de exclusão | Alto | Decisão do time antes de implementar |
| 3 | Role `SUPER_ADMIN` como mock em produção | Segurança | Implementar como entidade real |
| 4 | Branding em `localStorage` sem fallback | Estabilidade | Implementar fallback padrão |
| 5 | Campo `primeiroAcesso` via `localStorage` em produção | Inconsistência | Persistir no backend |

---

## O que NÃO fere a arquitetura

- A estrutura geral dos endpoints propostos
- A separação entre área pública (branding) e área autenticada
- A hierarquia de roles (`SUPER_ADMIN > ADMIN > USER`)
- O fluxo de onboarding descrito
- O modelo de tenant com status e plano

---

## Roadmap de Implementação Recomendado

### Fase 1 — Estabilizar (sem novas features)
1. Corrigir path `/anuncios` → `/proprietario/properties`
2. Corrigir DTO de criação de funcionário
3. Implementar refresh de sessão (endpoint já existe, frontend não usa)
4. Adicionar `primeiroAcesso` na resposta do login

### Fase 2 — Branding
5. Criar contrato público de branding (`GET /configuracoes/painel`)
6. Criar contrato autenticado de branding (`PUT /configuracoes/painel`)
7. Implementar upload de logo

### Fase 3 — Super Admin
8. Implementar role `SUPER_ADMIN` real no backend
9. Criar endpoints `/super-admin/tenants` com auditoria
10. Implementar suspensão com bloqueio de acesso

### Fase 4 — Expansão
11. Leads
12. Integração com reservas e métricas
13. Chat (decisão pendente)

---

## Decisões Pendentes (requerem resposta do time)

| # | Decisão | Responsável | Prazo |
|---|---------|-------------|-------|
| 1 | Deleção de tenant: hard-delete ou soft-delete? | Tech Lead + PO | Antes da Fase 3 |
| 2 | Impersonação de Admin de tenant pelo Super Admin? | PO | Antes da Fase 3 |
| 3 | Leads entram no produto? Backend cria endpoints? | PO | Antes da Fase 4 |
| 4 | Chat entra no painel admin? | PO | Antes da Fase 4 |
| 5 | Requisitos de LGPD nesta fase? | PO + Jurídico | Antes da Fase 3 |

---

*Responsável: Arquiteto de Software Estratégico*
