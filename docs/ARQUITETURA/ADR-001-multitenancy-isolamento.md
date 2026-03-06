# ADR-001 — Estratégia de Multi-Tenancy e Isolamento

**Status:** Aprovado  
**Data:** 2026-03-05  
**Contexto:** Imobix Painel Web

---

## Contexto

O Imobix é uma plataforma B2B para imobiliárias com foco em aluguel por temporada.  
Cada imobiliária é um **tenant independente**, com seus próprios usuários, imóveis, reservas e configurações.  
A plataforma precisa garantir segregação total de dados entre tenants.

---

## Problema

Como garantir que os dados de um tenant nunca sejam acessíveis por outro, de forma segura, simples e escalável para o estágio atual do produto?

---

## Decisão

Adotar **multi-tenancy com isolamento lógico**, onde todos os tenants coexistem na mesma infraestrutura mas com dados rigorosamente separados.

O tenant é **identificado via contexto de identidade** — derivado automaticamente do usuário autenticado, sem que o cliente precise informar ou manipular o identificador do tenant nas requisições.

---

## Justificativa

| Critério | Isolamento Lógico | Isolamento Físico |
|----------|:-----------------:|:-----------------:|
| Custo operacional | Baixo | Alto |
| Complexidade inicial | Baixa | Alta |
| Escala atual (tenants pequenos) | Adequado | Excessivo |
| Segurança com governança correta | Suficiente | Superior |

O isolamento físico seria mais seguro, mas o custo e a complexidade são desproporcionais ao estágio atual do produto.

---

## Regras de Governança

### Obrigatório
- Todo recurso de domínio (imóveis, reservas, usuários, configurações) **deve** ser filtrado pelo tenant do usuário autenticado
- O contexto de identidade **deve** conter o identificador do tenant
- Nenhuma operação de usuário comum pode definir ou alterar o tenant de forma arbitrária
- Suspensão de tenant **deve** bloquear o acesso de **todos** os usuários daquele tenant

### Proibido
- Endpoints que aceitem um tenant arbitrário para usuários com papel comum (não-admin global)
- Retornar dados de múltiplos tenants para usuários que não sejam Admin Global

### Recomendado
- Políticas de limites por plano (máximo de usuários, máximo de anúncios) aplicadas no domínio
- Trilha de auditoria para ações que cruzem fronteiras de tenant

---

## Consequências

### Positivas
- Simples de operar e escalar no curto prazo
- Menor custo de infraestrutura
- Desenvolvimento mais rápido

### Negativas / Riscos
- Vazamento de dados se houver endpoints sem filtro de tenant aplicado
- Necessita disciplina de implementação (todo endpoint precisa respeitar o filtro)
- Conflito potencial entre papel de Admin Global e escopo do tenant

---

## Decisões Pendentes

- [ ] Confirmação do time sobre o volume de tenants previstos nos próximos 12 meses
- [ ] Definição de limites por plano (Básico / Pro / Enterprise)

---

*Responsável: Arquiteto de Software Estratégico*
