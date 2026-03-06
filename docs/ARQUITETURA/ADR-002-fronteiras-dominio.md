# ADR-002 — Fronteiras de Domínio

**Status:** Aprovado  
**Data:** 2026-03-05  
**Contexto:** Imobix Painel Web

---

## Contexto

O produto Imobix concentra funcionalidades que pertencem a domínios distintos:  
- Administração global da plataforma (gestão de tenants)  
- Configuração visual por tenant (branding)  
- Identidade de usuários e fluxo de primeiro acesso (onboarding)

Misturar esses domínios em um único contexto gera acoplamento, risco de privilégios indevidos e dificuldade de evolução independente.

---

## Decisão

Separar o produto em **três contextos de domínio independentes**, cada um com responsabilidades claras e fronteiras explícitas.

---

## Contextos Definidos

### Contexto 1 — Tenant Management (Admin Global)

**Responsabilidade:** Governança da plataforma como um todo.

**O que pertence aqui:**
- Lifecycle de tenants (criação, suspensão, reativação, remoção)
- Políticas de plano (Básico, Pro, Enterprise)
- Visibilidade global de métricas de uso
- Gestão do papel de Admin Global

**O que NÃO pertence aqui:**
- Operações internas do tenant (imóveis, reservas, usuários do tenant)
- Configurações visuais de um tenant específico

**Quem acessa:** Apenas Admin Global

---

### Contexto 2 — Branding / Configuração

**Responsabilidade:** Identidade visual e configurações do painel por tenant.

**O que pertence aqui:**
- Nome do painel, subtítulo
- Cores (primária, sidebar)
- Logo do tenant
- Leitura pública de branding (necessária para a tela de login)

**O que NÃO pertence aqui:**
- Gestão de usuários do tenant
- Operações de negócio (imóveis, reservas, financeiro)

**Quem acessa:**
- Leitura: público (sem autenticação) — necessário para login
- Escrita: apenas Admin do tenant

---

### Contexto 3 — Identidade & Onboarding

**Responsabilidade:** Ciclo de vida da identidade do usuário dentro da plataforma.

**O que pertence aqui:**
- Autenticação (login, logout, refresh de sessão)
- Primeiro acesso (fluxo de configuração inicial)
- Redefinição de credenciais
- Bloqueio/desbloqueio de usuários
- Promoção de papéis

**O que NÃO pertence aqui:**
- Dados de negócio do tenant
- Configurações visuais

**Quem acessa:** Varia por operação — ver ADR-003 para papéis

---

## Regras de Fronteira

### Obrigatório
- Nenhum contexto deve cruzar a fronteira do outro diretamente
- Comunicação entre contextos deve ser via contrato explícito (não acesso direto)
- Admin Global não pode operar dados de negócio de um tenant sem auditoria

### Proibido
- Misturar regras de Tenant Management com regras de operação interna do tenant
- Expor dados de Identidade (credenciais, tokens) em contextos de Branding

### Recomendado
- Cada contexto evoluir de forma independente
- Breaking changes em um contexto não devem forçar mudanças nos outros

---

## Consequências

### Positivas
- Evolução independente de cada contexto
- Menor risco de privilégios indevidos
- Facilita distribuição de trabalho entre times

### Negativas / Riscos
- Exige disciplina para não "vazar" responsabilidades entre contextos
- Pode gerar duplicação de alguns dados se os contextos não se comunicarem bem

---

*Responsável: Arquiteto de Software Estratégico*
