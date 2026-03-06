# ARQUITETURA — Imobix Painel Web

> Decisões arquiteturais do produto Imobix (Painel Web).
> Todos os documentos são **agnósticos de tecnologia** e definem **o que** deve existir e **por quê**, não **como implementar**.

---

## Princípios Fundamentais

- **Separação por contexto de domínio** — cada contexto tem responsabilidades claras e não viola o outro
- **Isolamento rigoroso entre tenants** — dados de um tenant nunca são acessíveis por outro
- **Governança clara de contratos** — mudanças de API exigem processo formal
- **Segurança por menor privilégio** — cada papel acessa apenas o necessário
- **Evolução incremental** — novas features não quebram contratos existentes

---

## Documentos

| Documento | Decisão |
|-----------|---------|
| [ADR-001](./ADR-001-multitenancy-isolamento.md) | Estratégia de Multi-Tenancy e Isolamento |
| [ADR-002](./ADR-002-fronteiras-dominio.md) | Fronteiras de Domínio |
| [ADR-003](./ADR-003-super-admin-governanca.md) | Governança do Super Admin |
| [ADR-004](./ADR-004-branding-contrato-publico.md) | Branding e Contrato Público |
| [ADR-005](./ADR-005-governanca-contratos-integracao.md) | Governança de Contratos de Integração |
| [ADR-006](./ADR-006-compatibilidade-frontend.md) | Compatibilidade com Requisitos do Frontend |

---

## Roadmap Arquitetural

### Onda 1 — Estabilizar o Core
- Fechar contrato de autenticação e perfis
- Definir e aplicar governança de multi-tenancy
- Corrigir divergências de contrato (sem criar novas features)

### Onda 2 — Administração Global
- Formalizar papel de Super Admin
- Criar governança de lifecycle de tenants
- Auditoria mínima de ações críticas

### Onda 3 — Experiência de Tenant
- Branding persistente por tenant
- Onboarding formal
- Limites de uso por plano

### Onda 4 — Expansões
- Leads
- Chat
- Reservas e métricas avançadas

---

## Decisões Pendentes (requerem resposta do time)

| # | Decisão | Impacto |
|---|---------|---------|
| 1 | O backend vai implementar multi-tenancy real? Quando? | Alto |
| 2 | Leads entram no produto? Backend cria os endpoints? | Alto |
| 3 | Remoção de tenant é irreversível (hard-delete) ou reversível (soft-delete)? | Alto |
| 4 | Chat entra no painel admin? | Médio |
| 5 | Há requisitos de LGPD nesta fase? | Médio |
| 6 | Quais limites por plano devem ser aplicados agora? | Médio |

---

## Como usar estes documentos

1. **Tech Lead** lê todos os ADRs antes de tomar decisões de tecnologia
2. **Dev Backend** usa os ADRs como referência para implementação
3. **Dev Frontend** respeita as fronteiras de contrato definidas no ADR-005 e ADR-006
4. Qualquer mudança de decisão arquitetural deve atualizar o ADR correspondente com data e justificativa

---

*Gerado por: Arquiteto de Software Estratégico*
*Data: 2026-03-05*
