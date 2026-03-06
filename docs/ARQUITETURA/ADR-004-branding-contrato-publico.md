# ADR-004 — Branding e Contrato Público

**Status:** Aprovado  
**Data:** 2026-03-05  
**Contexto:** Imobix Painel Web

---

## Contexto

O Imobix é uma plataforma white-label: cada tenant (imobiliária) deve ter sua identidade visual própria — nome, cores e logo.

O usuário precisa ver a identidade visual do seu tenant **antes de se autenticar** (na tela de login). Isso cria a necessidade de um recurso público de branding, acessível sem token.

Atualmente o branding é salvo apenas no `localStorage` do navegador, sem persistência real no backend.

---

## Problema

Como disponibilizar a identidade visual por tenant de forma segura, pública onde necessário, e persistente?

---

## Decisão

Criar um **contrato de branding por tenant** com dois níveis de acesso:

1. **Leitura pública** — disponível sem autenticação, necessário para a tela de login
2. **Escrita autenticada** — restrita ao Admin do tenant

O branding deve ser **persistido no backend por tenant**, não apenas no cliente.

---

## Estrutura do Contrato de Branding

### Dados que compõem o branding de um tenant

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| Nome do painel | texto | Sim | Exibido na sidebar e título da aba |
| Subtítulo | texto | Sim | Exibido abaixo do nome na sidebar |
| URL da logo | texto ou nulo | Não | URL pública da imagem |
| Cor primária | hex | Sim | Botões, links, itens ativos |
| Cor da sidebar | hex | Sim | Fundo da sidebar |

### Valores padrão (fallback)
Quando um tenant não tiver branding configurado, o sistema deve retornar valores padrão da plataforma (identidade Imobix).  
Isso garante que a tela de login nunca falhe por ausência de configuração.

---

## Regras de Acesso

| Operação | Autenticação | Quem pode |
|----------|:------------:|-----------|
| Ler branding | Não (público) | Qualquer requisição |
| Atualizar branding | Sim | Apenas Admin do tenant |
| Fazer upload de logo | Sim | Apenas Admin do tenant |

---

## Regras de Governança

### Obrigatório
- Leitura de branding **deve** ser pública e sem autenticação
- Branding **deve** ser persistido no backend, por tenant
- Deve haver **fallback** para valores padrão da plataforma quando não configurado
- Upload de logo deve ter validações mínimas (formato e tamanho máximo)

### Proibido
- Expor dados sensíveis (credenciais, tokens, dados de usuários) no contrato público de branding
- Permitir que um tenant altere o branding de outro tenant

### Recomendado
- Cache do branding no cliente para evitar requisição a cada carregamento
- Invalidação de cache quando o branding for atualizado

---

## Fluxo de Aplicação do Branding

```
Usuário acessa o painel (sem login)
        ↓
Frontend solicita branding do tenant (requisição pública)
        ↓
Backend retorna: nome, cores, logo (ou fallback padrão)
        ↓
Frontend aplica identidade visual dinamicamente
        ↓
Tela de login exibe a marca da imobiliária
        ↓
Usuário faz login → painel carrega com a mesma identidade visual
```

---

## Situação Atual vs. Decisão

| Item | Situação Atual | Decisão |
|------|---------------|---------|
| Branding | Salvo no `localStorage` | Persistir no backend por tenant |
| Leitura pública | Endpoint não existe | Criar contrato público |
| Escrita | Endpoint não existe | Criar contrato autenticado (Admin) |
| Fallback | Não existe | Definir valores padrão da plataforma |

---

## Consequências

### Positivas
- Identidade visual persiste entre dispositivos e sessões
- Onboarding do tenant pode incluir configuração de branding como etapa obrigatória
- Fallback garante estabilidade mesmo sem configuração

### Negativas / Riscos
- Recurso público pode ser chamado em excesso se não houver cache
- Upload de logo requer política de armazenamento de arquivos (definida pelo Tech Lead)

---

## Decisões Pendentes

- [ ] Onde os arquivos de logo serão armazenados? (definição do Tech Lead/DevOps)
- [ ] Branding será obrigatório no onboarding ou opcional?

---

*Responsável: Arquiteto de Software Estratégico*
