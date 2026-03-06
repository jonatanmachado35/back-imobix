# Guia de Integração — Dev Frontend
**Projeto:** Imobix Painel Web  
**Data:** 2026-03-05  
**Destinatário:** Time de Frontend  
**Origem:** Arquitetura + Leitura do código real do backend

> Este documento descreve **o que já existe no backend**, **o que ainda não existe**, e **como integrar corretamente** cada recurso.  
> Não assuma nada que não esteja neste documento como disponível.

---

## 1. URL Base da API

```
https://<dominio>/api  (produção)
http://localhost:3000  (desenvolvimento)
```

Documentação Swagger disponível em: `GET /api/docs`

---

## 2. Autenticação

### 2.1 Login

```
POST /auth/login
```

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta 200:**
```json
{
  "access_token": "<JWT>",
  "user": {
    "id": "clxyz123456789",
    "nome": "Maria Silva",
    "email": "maria@exemplo.com",
    "role": "ADMIN",
    "userType": "proprietario"
  }
}
```

**Roles possíveis no campo `role`:** `ADMIN` | `USER`  
**userType possíveis:** `cliente` | `proprietario`

> ⚠️ **IMPORTANTE:** O campo `role: "SUPER_ADMIN"` **NÃO EXISTE** no backend. Qualquer lógica de Super Admin baseada em mock deve ser removida antes de ir para produção. Veja seção 8.

> ⚠️ **IMPORTANTE:** O campo `primeiroAcesso` **NÃO EXISTE** na resposta do login ainda. Está na fila do backend para ser adicionado (ver seção 8.2).

### 2.2 Refresh de Token

```
POST /auth/refresh-token
Body: { "refreshToken": "<token>" }
```

**Resposta 200:**
```json
{
  "access_token": "<novo JWT>",
  "refresh_token": "<novo refresh token>"
}
```

> ⚠️ Este endpoint **já existe** mas o frontend **não está usando**. Implementar refresh automático para evitar logout inesperado do usuário.

### 2.3 Logout

```
POST /auth/logout
Header: Authorization: Bearer <token>
```

### 2.4 Trocar Senha (usuário autenticado)

```
POST /auth/change-password
Header: Authorization: Bearer <token>
Body: { "currentPassword": "atual", "newPassword": "nova" }
```

### 2.5 Reset de Senha (fluxo admin)

```
# Admin gera o token:
POST /auth/admin/request-password-reset   [ADMIN only]
Body: { "email": "usuario@exemplo.com" }
Resposta: { "resetToken": "...", "expiresAt": "..." }

# Usuário usa o token:
POST /auth/reset-password
Body: { "resetToken": "...", "newPassword": "..." }
```

---

## 3. Usuários

### 3.1 Auto-cadastro (público)

```
POST /users
Body:
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "password": "minimo8chars",
  "userRole": "cliente"   // ou "proprietario"
}
```

### 3.2 Perfil do usuário autenticado

```
GET  /users/me    → retorna dados do usuário logado
PATCH /users/me   → atualiza nome, email, phone, avatar
```

**Body do PATCH:**
```json
{
  "name": "Novo Nome",
  "email": "novo@email.com",
  "phone": "11999999999",
  "avatar": "https://..."
}
```

> ⚠️ Atenção: no PATCH, o campo é `name` (não `nome`). É uma inconsistência real do backend — não altere, apenas adapte.

---

## 4. Admin — Gestão de Usuários do tenant

> Todos os endpoints abaixo exigem `role: ADMIN` no token JWT.

```
GET  /admin/users                        → lista usuários (com filtros e paginação)
PATCH /admin/users/:userId/promote       → promove USER → ADMIN
PATCH /admin/users/:userId/block         → bloqueia usuário
PATCH /admin/users/:userId/unblock       → desbloqueia usuário
```

**Query params do GET /admin/users:**
```
?page=1&limit=10&role=USER&status=active&search=maria
```

**Resposta do GET:**
```json
{
  "data": [
    {
      "id": "...",
      "nome": "...",
      "email": "...",
      "role": "USER",
      "userRole": "cliente",
      "status": "active",
      "createdAt": "..."
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

---

## 5. Funcionários

```
GET  /funcionarios          → lista todos os funcionários
GET  /funcionarios/:id      → detalhe de um funcionário
POST /funcionarios          → cria novo funcionário
```

**Body do POST:**
```json
{
  "nome": "Maria Santos",
  "email": "maria@imobix.com",
  "password": "minimo8chars",
  "cpf": "987.654.321-00",       // opcional
  "telefone": "(11) 91234-5678", // opcional
  "status": "ATIVO",             // opcional, default: ATIVO
  "endereco": "Rua das Flores",  // opcional
  "departamento": "TI"           // opcional
}
```

> ⚠️ **DIVERGÊNCIA CONFIRMADA:** Se o frontend está enviando um DTO diferente deste (ex: sem `password`, ou com campos com nomes diferentes), isso causará erro `400`. Alinhe com este contrato real.

---

## 6. Corretores

```
GET  /corretores          → lista todos os corretores
GET  /corretores/:id      → detalhe de um corretor
POST /corretores          → cria novo corretor
```

---

## 7. Imóveis

### 7.1 Listagem pública (sem autenticação)

```
GET /properties                          → lista imóveis ativos
GET /properties/featured                 → até 6 imóveis em destaque
GET /properties/seasonal                 → imóveis de temporada
GET /properties/:id                      → detalhe de um imóvel
GET /properties/:id/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
```

**Filtros disponíveis no GET /properties:**
```
?type=TEMPORADA&city=Florianópolis&minPrice=100&maxPrice=1000&bedrooms=3
```

**Tipos de imóvel:** `VENDA` | `ALUGUEL` | `TEMPORADA`

### 7.2 Área do proprietário (autenticado)

```
GET    /proprietario/properties              → meus imóveis
POST   /proprietario/properties              → criar imóvel
PATCH  /proprietario/properties/:id          → editar imóvel
PATCH  /proprietario/properties/:id/status   → ativar/pausar/remover
DELETE /proprietario/properties/:id          → remover imóvel

GET    /proprietario/properties/:id/images             → listar imagens
POST   /proprietario/properties/:id/images             → upload de imagem (multipart/form-data)
DELETE /proprietario/properties/:id/images/:imageId    → deletar imagem
PATCH  /proprietario/properties/:id/images/:imageId/primary → definir como principal
```

> ⚠️ **DIVERGÊNCIA CONFIRMADA:** O frontend chama `/anuncios`. O backend responde em `/proprietario/properties`. **Corrija no frontend.**

**Body do POST /proprietario/properties:**
```json
{
  "type": "TEMPORADA",
  "title": "Casa na Praia de Jurerê",
  "description": "...",
  "pricePerNight": 500,
  "holidayPrice": 800,
  "address": "Rua das Flores, 123",
  "city": "Florianópolis",
  "neighborhood": "Jurerê",
  "bedrooms": 3,
  "bathrooms": 2,
  "parkingSpaces": 2,
  "area": 150.5,
  "amenities": ["wifi", "piscina"],
  "petFriendly": false,
  "furnished": true,
  "minNights": 2,
  "maxGuests": 8,
  "checkInTime": "14:00",
  "checkOutTime": "11:00",
  "houseRules": ["Não fumar"],
  "category": "PRAIA"
}
```

**Categorias disponíveis:** `CHALE` | `PRAIA` | `FAZENDA` | `SITIO` | `LUXO` | `CASA` | `APARTAMENTO`

**Upload de imagem (multipart/form-data):**
```
file: <arquivo>           (obrigatório, máx 10MB, JPEG/PNG/WEBP)
isPrimary: true/false     (opcional)
displayOrder: 0           (opcional)
```

---

## 8. Dashboard do Proprietário e Reservas

```
GET  /proprietario/dashboard           → métricas do proprietário
GET  /proprietario/bookings            → reservas dos meus imóveis
PATCH /proprietario/bookings/:id/confirm → confirmar reserva
PATCH /proprietario/bookings/:id/cancel  → cancelar reserva (como dono)

POST  /bookings                        → criar reserva (como hóspede)
GET   /bookings/my                     → minhas reservas (como hóspede)
PATCH /bookings/:id/cancel             → cancelar reserva (como hóspede)
```

**Resposta do GET /proprietario/dashboard:**
```json
{
  "totalProperties": 5,
  "pendingBookings": 2,
  "confirmedBookings": 8,
  "completedBookings": 20,
  "totalRevenue": 15000.00,
  "recentBookings": [...]
}
```

---

## 9. Chat / Conversas

> ✅ Este módulo **já existe** no backend. O frontend precisa apenas integrar.

```
GET  /conversations                           → listar minhas conversas
POST /conversations                           → criar ou obter conversa existente
GET  /conversations/:id/messages              → listar mensagens
POST /conversations/:id/messages              → enviar mensagem
```

**Body do POST /conversations:**
```json
{ "propertyId": "<id do imóvel>" }
```

**Body do POST /conversations/:id/messages:**
```json
{ "text": "Olá, tenho interesse no imóvel." }
```

---

## 10. O que NÃO EXISTE no backend (não integre ainda)

| Recurso | Situação | O que fazer |
|---------|----------|-------------|
| `SUPER_ADMIN` role | ❌ Não existe — apenas mock | Não usar em produção. Backend vai criar. Aguarde ADR-003. |
| `primeiroAcesso` no login | ❌ Não existe | Usar localStorage temporariamente com `// TODO: remover quando backend implementar` |
| `GET /configuracoes/painel` | ❌ Não existe | Manter fallback local com cores padrão Imobix |
| `PUT /configuracoes/painel` | ❌ Não existe | Desabilitar opção de salvar branding na UI |
| `POST /configuracoes/painel/logo` | ❌ Não existe | Não exibir botão de upload de logo |
| `GET /super-admin/tenants` | ❌ Não existe | Todo o painel Super Admin deve usar mock com aviso visível |
| `POST /super-admin/tenants` | ❌ Não existe | Idem |
| `GET /leads` | ❌ Não existe | Não exibir módulo de leads |

---

## 11. Divergências ativas a corrigir no frontend

| # | Problema | Correção necessária |
|---|----------|---------------------|
| 1 | Frontend chama `/anuncios` | Mudar para `/proprietario/properties` |
| 2 | DTO de criação de funcionário com campos errados | Usar o contrato da seção 5 |
| 3 | `role: "SUPER_ADMIN"` no mock | Não usar. Tratar como `role: "ADMIN"` por enquanto |
| 4 | Branding salvo em `localStorage` | Manter, mas sinalizar como `// TODO` |
| 5 | `primeiroAcesso` via `localStorage` | Manter, mas sinalizar como `// TODO` |
| 6 | Refresh token não utilizado | Implementar interceptor de refresh automático |

---

## 12. Regras de segurança que o frontend deve respeitar

1. **Nunca enviar `tenantId` manualmente** nas requisições. O backend deriva do token JWT.
2. **Sempre incluir** `Authorization: Bearer <token>` nos endpoints autenticados.
3. **Token expirado?** Chamar `POST /auth/refresh-token` automaticamente antes de exibir erro de sessão.
4. O campo `role` no token define o que cada usuário vê. Use-o para controle de UI — mas o backend revalida tudo server-side.

---

## 13. Padrão de erros da API

| Status | Significado |
|--------|-------------|
| `400` | Dados inválidos (body malformado, campo faltando) |
| `401` | Não autenticado (token ausente ou expirado) |
| `403` | Sem permissão (autenticado, mas sem o role necessário) |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex: email já cadastrado, usuário já bloqueado) |
| `422` | Regra de negócio violada (ex: tentar promover usuário bloqueado) |
| `500` | Erro inesperado — reportar ao time de backend |

---

## 14. Próximos passos para o time de frontend

| Prioridade | Ação |
|------------|------|
| 🔴 Alta | Corrigir path `/anuncios` → `/proprietario/properties` |
| 🔴 Alta | Corrigir DTO do `POST /funcionarios` |
| 🔴 Alta | Implementar refresh automático de token |
| 🟡 Média | Integrar chat (`/conversations`) — backend já está pronto |
| 🟡 Média | Marcar todos os mocks de Super Admin com `// TODO` |
| 🟡 Média | Marcar `primeiroAcesso` via localStorage com `// TODO` |
| 🟢 Baixa | Aguardar backend implementar `/configuracoes/painel` e Super Admin real |

---

*Documento gerado por: Tech Lead / Arquiteto*  
*Baseado em: ADR-001 ao ADR-006 + leitura do código real do backend*  
*Data: 2026-03-05*
