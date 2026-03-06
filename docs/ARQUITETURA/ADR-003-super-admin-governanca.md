# ADR-003 — Governança do Super Admin

**Status:** Aprovado  
**Data:** 2026-03-05  
**Contexto:** Imobix Painel Web

---

## Contexto

O produto precisa de um papel de administração global capaz de gerenciar todos os tenants da plataforma.

Atualmente esse papel existe apenas como mock hardcoded no frontend, sem suporte real no backend.  
Ações críticas (suspender tenant, deletar tenant) não têm auditoria nem controle de acesso real.

---

## Problema

Como formalizar o papel de Admin Global de forma segura, auditável e com fronteiras claras, sem misturar suas responsabilidades com as do Admin de tenant?

---

## Decisão

Instituir um **papel global formal** com:
- Permissões exclusivas sobre o lifecycle de tenants
- Separação total do escopo de Admin de tenant
- Auditoria obrigatória para ações críticas

---

## Definição do Papel

### Admin Global (Super Admin)

**O que pode fazer:**

| Ação | Permitido | Requer Auditoria |
|------|:---------:|:----------------:|
| Listar todos os tenants | ✅ | Não |
| Criar tenant | ✅ | Sim |
| Editar dados do tenant | ✅ | Sim |
| Suspender tenant | ✅ | Sim |
| Reativar tenant | ✅ | Sim |
| Deletar tenant | ✅ | Sim — ver decisão pendente |
| Ver métricas de uso global | ✅ | Não |
| Operar dados internos de um tenant | ❌ | — |
| Impersonar Admin de tenant | ❌ (pendente de decisão) | — |

**O que NÃO pode fazer sem auditoria:**
- Nenhuma ação de escrita (criação, edição, suspensão, remoção) pode ocorrer sem registro

---

## Regras de Governança

### Obrigatório
- O papel de Admin Global **deve** existir como entidade real no backend (não mock)
- Toda ação crítica do Admin Global **deve** gerar registro de auditoria com: ator, ação, alvo, data/hora
- Suspensão de tenant **deve** bloquear o acesso de todos os usuários do tenant imediatamente
- A criação de um novo tenant **deve** gerar automaticamente um usuário Admin para aquele tenant com fluxo de primeiro acesso ativo

### Proibido
- Admin Global acessar ou modificar dados de negócio de um tenant sem trilha de auditoria
- Qualquer usuário comum (Admin de tenant, User) executar ações do escopo de Admin Global

### Recomendado
- Admin Global sempre ter `primeiroAcesso: false` (não passa pelo onboarding de tenant)
- Existir no máximo um número reduzido de usuários com esse papel (princípio de menor privilégio)

---

## Fluxo de Criação de Tenant

```
Admin Global cria tenant
        ↓
Backend cria: tenant + usuário Admin do tenant com primeiroAcesso: true
        ↓
Admin do tenant faz login
        ↓
Sistema detecta primeiroAcesso: true → redireciona para onboarding
        ↓
Admin configura branding (nome, cores, logo)
        ↓
Sistema marca primeiroAcesso: false → acesso ao painel liberado
```

---

## Decisões Pendentes

- [ ] **Deleção de tenant:** irreversível (hard-delete) ou reversível (soft-delete)?  
  → Impacto: compliance, LGPD, recuperação de dados
- [ ] **Impersonação:** Admin Global pode logar como Admin de tenant?  
  → Se sim: requer auditoria obrigatória e consentimento explícito
- [ ] **Número de Admins Globais:** limite definido ou aberto?

---

## Consequências

### Positivas
- Controle real sobre o lifecycle de tenants
- Rastreabilidade de ações críticas
- Elimina dependência de mocks

### Negativas / Riscos
- Requer implementação completa no backend (não existe hoje)
- Se a auditoria não for implementada junto, o papel fica sem controle
- Deleção irreversível de tenant é operação de alto risco

---

*Responsável: Arquiteto de Software Estratégico*
