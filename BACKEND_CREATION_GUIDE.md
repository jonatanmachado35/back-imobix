# Guia de Desenvolvimento Backend - Imobix Painel

Este documento serve como especificação técnica para o desenvolvimento da API backend que suportará o painel administrativo Imobix.

## Visão Geral

O sistema é um painel administrativo para gestão imobiliária, focado em aluguel de temporada, gestão de equipe (funcionários e corretores), CRM de leads e controle financeiro.

**Stack Sugerida:**
- Node.js com NestJS, Express ou Fastify
- Banco de dados Relacional (PostgreSQL/MySQL) ou NoSQL (MongoDB)
- Autenticação via JWT (Access + Refresh Token)

---

## 1. Módulo de Autenticação (`/auth`)

### Modelos de Dados
**User** (Pode servir tanto para Admins quanto Funcionários)
- `id`: UUID
- `nome`: String
- `email`: String (Unique)
- `senha`: Hash (bcrypt/argon2)
- `role`: Enum ("Administrador", "User")
- `avatar`: String (URL, opcional)
- `createdAt`: Datetime

### Endpoints
- `POST /auth/login`
  - **Payload**: `{ email, senha }`
  - **Retorno**: `{ token, refreshToken, user: { id, nome, email, role } }`
- `POST /auth/refresh`
  - **Payload**: `{ refreshToken }`
  - **Retorno**: `{ token, refreshToken }`
- `POST /auth/logout`
  - **Payload**: `{ refreshToken }`
- `GET /auth/me`
  - **Header**: `Authorization: Bearer <token>`
  - **Retorno**: Dados do usuário atual

---

## 2. Módulo de Pessoas (`/funcionarios`, `/corretores`)

### 2.1 Funcionários
Gestão de usuários do sistema administrativo.

**Campos:**
- `cpf`: String
- `telefone`: String
- `status`: Enum ("ativo", "inativo")
- `dataCadastro`: Date

**Endpoints:**
- `GET /funcionarios` (Listar, com paginação e busca por nome)
- `GET /funcionarios/:id` (Detalhes)
- `POST /funcionarios` (Criar - gera usuário de acesso)
- `PATCH /funcionarios/:id` (Atualizar)
- `DELETE /funcionarios/:id` (Remover - soft delete recomendado)

### 2.2 Corretores
Profissionais externos ou parceiros.

**Campos Adicionais:**
- `creci`: String
- `totalVendas`: Number
- `especialidade`: String
- `comissaoTotal`: Number

**Endpoints:**
- `GET /corretores`
- `GET /corretores/:id`
- `POST /corretores`
- `PATCH /corretores/:id`
- `DELETE /corretores/:id`

---

## 3. Módulo CRM (`/leads`)

Gestão do funil de vendas.

### Modelo de Dados
**Lead**
- `id`: UUID
- `nome`: String
- `email`: String
- `telefone`: String
- `origem`: String (Ex: "Site", "Instagram")
- `interesse`: String (Descrição do que procura)
- `status`: Enum ("novo", "contatado", "qualificado", "convertido", "perdido")
- `dataContato`: Date
- `anotacoes`: Text (Opcional)

### Endpoints
- `GET /leads` (Filtros: status, data, origem)
- `POST /leads`
- `PATCH /leads/:id` (Principalmente para atualizar status)
- `POST /leads/import` (Upload de Excel/CSV para criação em massa)

---

## 4. Módulo Imobiliário (`/anuncios`)

Focado em propriedades de aluguel por temporada.

### Modelo de Dados
**PropriedadeTemporada**
- `id`: UUID
- `titulo`: String
- `tipo`: Enum ("casa_praia", "apartamento_praia", "sitio", "chacara", "casa_campo", "cobertura", etc.)
- `endereco`: String
- `cidade`: String
- `estado`: String (UF)
- `valorDiaria`: Decimal
- `valorDiariaFimSemana`: Decimal
- `status`: Enum ("aguardando_aprovacao", "ativo", "inativo", "rejeitado")
- `proprietario`: String (Nome ou FK para Usuário/Cliente)
- `capacidadeHospedes`: Int
- `quartos`: Int
- `camas`: Int
- `banheiros`: Int
- `areaTotal`: Float
- `minimoNoites`: Int
- `dataEnvio`: Date (Data de criação do anúncio)
- `imagens`: Array<String> (URLs)

### Endpoints
- `GET /anuncios`
  - Query Params: `search` (título, cidade), `status` (filtro), `page`, `limit`
- `GET /anuncios/:id`
- `POST /anuncios`
- `PATCH /anuncios/:id`
- `DELETE /anuncios/:id`
- `PATCH /anuncios/:id/status` (Aprovação/Rejeição)

---

## 5. Módulo Financeiro (`/financeiro`)

Controle de fluxo de caixa.

### Modelo de Dados
**Transacao**
- `id`: UUID
- `descricao`: String
- `categoria`: Enum ("reserva", "comissao_corretor", "pagamento_proprietario", "taxa_plataforma", "cancelamento", "taxa_limpeza", "taxa_servico")
- `tipo`: Enum ("entrada", "saida")
- `valor`: Decimal
- `status`: Enum ("pago", "pendente", "cancelado", "processando")
- `data`: Date
- `dataVencimento`: Date (Opcional)
- `metodoPagamento`: String (Opcional)
- `propriedadeId`: FK (Opcional)
- `corretorId`: FK (Opcional)
- `hospedeId`: FK (Opcional - pode ser só nome string por enquanto)

### Endpoints
- `GET /financeiro/transacoes`
  - Filtros: `inicio`, `fim`, `categoria`, `status`
- `GET /financeiro/resumo`
  - Retorna totais consolidados para os cards do dashboard (Receitas, Despesas, Saldo, Pendentes)
- `GET /financeiro/export` (Bônus: Gerar CSV/PDF)

---

## 6. Módulo de Agenda (`/calendario`)

Visualização de ocupação e visitas.

### 6.1 Reservas
Vinculadas a propriedades de temporada.
- `id`: UUID
- `propriedadeId`: FK
- `hospede`: String
- `checkIn`: DateTime
- `checkOut`: DateTime
- `valorTotal`: Decimal
- `status`: Enum ("confirmada", "pendente", "cancelada")

### 6.2 Visitas
Agendamentos de visitas presenciais.
- `id`: UUID
- `propriedadeId`: FK
- `corretorId`: FK
- `cliente`: String
- `data`: DateTime (Data e Hora)
- `status`: Enum ("agendada", "realizada", "cancelada")

### Endpoints
- `GET /calendario/eventos`
  - Query Params: `inicio`, `fim` (Range de datas para busca)
  - Retorno: Objeto contendo arrays de `reservas` e `visitas`.

---

## Observações Gerais

1.  **Tratamento de Erros**: A API deve retornar erros consistentes, ex:
    ```json
    {
      "success": false,
      "message": "Mensagem amigável",
      "errors": { "campo": ["Erro de validação"] } // Opcional
    }
    ```
2.  **Paginação**: Endpoints de listagem (`getAll`) devem suportar `page` e `pageSize` por padrão.
3.  **CORS**: Configurar para aceitar requisições da origem do frontend.
