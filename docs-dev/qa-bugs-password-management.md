# 🐛 Bug Report: Password Management Endpoints

**Data:** 13/02/2026  
**QA Engineer:** GitHub Copilot  
**Feature:** Password Management (change-password / forgot-password simplificado)  
**Status:** ✅ CORRIGIDO E VERIFICADO EM REGRESSÃO QA

---

## 📋 Resumo Executivo

Validação executada contra o ADR [docs-dev/adr-password-management.md](docs-dev/adr-password-management.md).

### Testes executados

- `npm test -- --runInBand src/domain/entities/user.spec.ts src/application/use-cases/password`
  - ✅ 4 suites / 27 testes passando
- `npm run test:e2e -- password-management.e2e-spec.ts`
  - ✅ 1 suite / 6 testes passando

### Resultado QA

- ✅ Fluxos principais funcionam (change password, geração de token por admin, reset com token)
- ✅ Segurança básica implementada (JWT no change password, role ADMIN no endpoint admin, token de uso único)
- ✅ Bug de contrato HTTP identificado, corrigido pelo dev e validado em regressão

---

## 🐛 BUG-001: Status HTTP divergente do ADR em `POST /auth/admin/request-password-reset`

**Severidade:** P2 (Minor)  
**Prioridade:** Média  
**Categoria:** API Contract / REST Consistency  
**Status:** ✅ FECHADO (corrigido e verificado)

### Descrição

O ADR aprovado define que o endpoint admin de geração de token deve retornar **200 OK**.
A implementação atual retorna **201 Created**.

### Evidência

- ADR (especificação): [docs-dev/adr-password-management.md](docs-dev/adr-password-management.md) — seção Interface Layer define `@ApiResponse({ status: 200, ... })`
- Implementação atual: [src/auth/auth.controller.ts](src/auth/auth.controller.ts#L96-L115) documenta `status: 201` e não usa `@HttpCode(HttpStatus.OK)`
- Teste E2E atual valida 201: [test/password-management.e2e-spec.ts](test/password-management.e2e-spec.ts#L120-L128)

### Passos para Reproduzir

**Pré-condição:** usuário admin autenticado

1. Fazer `POST /auth/admin/request-password-reset` com body:
   ```json
   { "email": "password-user@test.com" }
   ```
2. Observar status retornado

### Resultado Esperado

- Status **200 OK** (conforme ADR)

### Resultado Atual

- Status **200 OK** (corrigido)

### Impacto

- Impacto removido após correção

### Correção Sugerida

**Arquivo:** [src/auth/auth.controller.ts](src/auth/auth.controller.ts#L96-L115)

1. Adicionar `@HttpCode(HttpStatus.OK)` no método `requestPasswordReset`
2. Alterar `@ApiResponse({ status: 201 ... })` para `status: 200`

**Arquivo de teste:** [test/password-management.e2e-spec.ts](test/password-management.e2e-spec.ts#L120-L128)

3. Ajustar `.expect(201)` para `.expect(200)`

### Critérios de Aceitação

- [x] Endpoint retorna 200
- [x] Swagger do endpoint documenta 200
- [x] E2E do endpoint validando 200 passa

---

## 📊 Test Execution Report

**Date:** 2026-02-13  
**Tested by:** QA (GitHub Copilot)  
**Scope:** Password management ADR

**Results:**
- Total test cases executados: 33
- Passed: 33
- Failed: 0
- Blocked: 0

**Defects Found (estado atual):**
- P0: 0
- P1: 0
- P2: 0 (BUG-001 fechado)
- P3: 0

**Recommendation:**
- ✅ **APPROVE** para escopo de password management do ADR.
- Regressão executada com sucesso em: `npm test -- --runInBand src/domain/entities/user.spec.ts src/application/use-cases/password` e `npm run test:e2e -- password-management.e2e-spec.ts`

---

## ✅ Checklist QA (estado atual)

### Funcional
- [x] Change password autenticado
- [x] Geração de reset token por admin
- [x] Reset de senha com token válido
- [x] Invalidação de token inválido

### Contrato/Especificação
- [x] Status code do endpoint admin alinhado ao ADR

### Segurança
- [x] Endpoint de mudança de senha protegido por JWT
- [x] Endpoint admin protegido por `RolesGuard` + `ADMIN`
- [x] Token de reset removido após uso

---

## Próximo passo para DEV

Aplicar a correção do BUG-001 e me avisar para eu executar a regressão QA e emitir o documento de aprovação final.
