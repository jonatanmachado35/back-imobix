# ADR-005 — Governança de Contratos de Integração

**Status:** Aprovado  
**Data:** 2026-03-05  
**Contexto:** Imobix Painel Web

---

## Contexto

O frontend e o backend são desenvolvidos por times diferentes e precisam se comunicar via contratos de API.

O cenário atual apresenta problemas sérios de alinhamento:
- Frontend implementou contratos assumidos sem validação do backend
- Há divergências de nomes de campos (DTOs), caminhos de rotas e tipos de dados
- Funcionalidades estão "prontas" no frontend mas os endpoints correspondentes não existem
- Mocks hardcoded disfarçam a falta de integração real

Sem governança, o custo de retrabalho cresce a cada ciclo.

---

## Problema

Como garantir que frontend e backend evoluam de forma coordenada, com contratos claros, previsíveis e com processo de mudança definido?

---

## Decisão

Formalizar um **processo de governança de contratos** com:
1. Fonte de verdade única para contratos
2. Processo de mudança com comunicação obrigatória
3. Política de compatibilidade retroativa
4. Versionamento explícito quando necessário

---

## Fonte de Verdade

A **documentação da API** (gerada automaticamente pelo backend) é a fonte de verdade dos contratos.

- Frontend **consome** os contratos definidos pelo backend
- Frontend **propõe** novos contratos quando precisa de novos recursos
- Backend **valida, ajusta e publica** o contrato final
- Arquitetura **arbitra** em caso de conflito de fronteiras de domínio

**Fluxo de novo contrato:**
```
Frontend identifica necessidade
        ↓
Frontend documenta a proposta (rota, payload, resposta esperada)
        ↓
Backend valida se a proposta respeita as regras de domínio e segurança
        ↓
Arquitetura valida se respeita as fronteiras definidas nos ADRs
        ↓
Backend implementa e publica na documentação oficial
        ↓
Frontend integra com base na documentação publicada
```

---

## Política de Mudança de Contrato

### Mudanças não-breaking (podem ser feitas a qualquer momento)
- Adicionar campos opcionais na resposta
- Adicionar novos endpoints
- Adicionar novos valores em enums (com cuidado)

### Mudanças breaking (exigem processo)
- Remover campos da resposta
- Renomear campos
- Alterar tipo de dados
- Remover endpoints
- Tornar campo opcional em obrigatório

**Processo para mudanças breaking:**
1. Comunicação formal ao time (pelo menos 1 sprint de antecedência)
2. Período de compatibilidade: manter versão antiga funcionando por pelo menos 1 ciclo
3. Atualização da documentação antes da implementação

---

## Versionamento de API

**Decisão atual:** sem versionamento formal no path (`/v1/...`).

**Justificativa:** o produto está em estágio inicial e o overhead de manter múltiplas versões não se justifica ainda.

**Gatilho para revisão:** quando houver clientes externos consumindo a API ou quando uma mudança breaking não puder ser coordenada em uma única sprint.

---

## Política de Mocks

Mocks no frontend são **temporários** e devem ser tratados como **dívida técnica**.

### Regras
- Todo mock deve ter comentário `// TODO: remover quando backend implementar`
- Mocks não podem ser promovidos para produção sem data de remoção definida
- A existência de um mock **não valida** o contrato — o contrato só é válido quando implementado no backend

---

## Regras de Governança

### Obrigatório
- Backend é o dono do contrato — frontend não pode "definir" a API unilateralmente
- Mudanças breaking exigem comunicação formal antes da implementação
- Mocks devem ser rastreados e removidos quando o backend estiver pronto

### Proibido
- Frontend assumir que um contrato proposto será implementado exatamente como proposto
- Backend alterar contratos em uso sem comunicação ao frontend
- Promover mocks para produção sem backend correspondente

### Recomendado
- Revisão semanal de divergências entre frontend e backend
- Documentação de API sempre atualizada antes do merge

---

## Divergências Atuais (a resolver)

| # | Divergência | Tipo | Prioridade |
|---|-------------|------|-----------|
| 1 | Path `/anuncios` vs `/proprietario/properties` | Breaking | Alta |
| 2 | DTO de criação de funcionário — campos diferentes | Breaking | Alta |
| 3 | Role `SUPER_ADMIN` não existe no backend | Breaking | Alta |
| 4 | Campo `primeiroAcesso` não existe no backend | Non-breaking add | Alta |
| 5 | Endpoints `/super-admin/*` não existem | Novo | Média |
| 6 | Endpoints `/configuracoes/painel` não existem | Novo | Média |
| 7 | Endpoints `/leads` não existem | Novo | Baixa |

---

## Consequências

### Positivas
- Reduz retrabalho causado por contratos assumidos
- Aumenta previsibilidade entre times
- Facilita onboarding de novos desenvolvedores

### Negativas / Riscos
- Requer disciplina de processo dos dois times
- Pode parecer "burocracia" em times pequenos — mas o custo da falta de processo é maior

---

*Responsável: Arquiteto de Software Estratégico*
