# 📋 QA - Upload de Fotos de Anúncios com Cloudinary

**Feature:** Upload de Imagens para Anúncios  
**Sprint:** Sprint 1  
**Data de Implementação:** 04 de Fevereiro de 2026  
**Desenvolvedor:** Backend Team  
**Status:** ✅ Pronto para Testes

---

## 📌 Resumo Executivo

Esta feature permite que usuários autenticados façam upload, gerenciamento e exclusão de fotos em anúncios de imóveis. As imagens são armazenadas no Cloudinary e os metadados são salvos no PostgreSQL.

### ✅ O que foi implementado

- ✅ Upload de imagens para anúncios (até 20 por anúncio)
- ✅ Listagem de imagens de um anúncio (ordenadas por primária e displayOrder)
- ✅ Exclusão de imagens com rollback automático
- ✅ Definição de imagem primária (apenas uma por anúncio)
- ✅ Validações de segurança e autenticação
- ✅ Testes unitários (100% cobertura de statements)
- ✅ Testes E2E (5 cenários cobertos)

---

## 🏗️ Arquitetura Implementada

### Clean Architecture (3 camadas)

```
┌─────────────────────────────────────────────┐
│  Presentation Layer (Interfaces)            │
│  • AnunciosController                        │
│    - POST /anuncios/:id/images              │
│    - GET /anuncios/:id/images               │
│    - DELETE /anuncios/:id/images/:imageId   │
│    - PATCH /anuncios/:id/images/:imageId/primary     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Application Layer (Use Cases)              │
│  • UploadAnuncioImageUseCase                │
│  • DeleteAnuncioImageUseCase                │
│  • ListAnuncioImagesUseCase                 │
│  • SetPrimaryImageUseCase                   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Infrastructure Layer                       │
│  • CloudinaryService (File Storage)         │
│  • PrismaService (Database)                 │
└─────────────────────────────────────────────┘
```

---

## 🧪 Cobertura de Testes

### Testes Unitários (Use Cases)

**Total:** 22 testes passando | **Cobertura:** 100% statements, 91.66% branches

#### UploadAnuncioImageUseCase (6 testes)
- ✅ Upload de imagem com sucesso
- ✅ Erro se anúncio não existe
- ✅ Erro se atingir limite de 20 imagens
- ✅ Define isPrimary e remove de outras
- ✅ Rollback em caso de falha no database
- ✅ Não falha se rollback falhar

#### DeleteAnuncioImageUseCase (5 testes)
- ✅ Deleta imagem com sucesso
- ✅ Erro se imagem não encontrada
- ✅ Define nova imagem primária se deletada era primária
- ✅ Continua mesmo se delete do storage falhar
- ✅ Não define nova primária se deletada não era primária

#### SetPrimaryImageUseCase (6 testes)
- ✅ Define imagem como primária com sucesso
- ✅ Erro se imagem não encontrada
- ✅ Erro se imagem pertence a outro anúncio
- ✅ Retorna sem mudanças se já é primária
- ✅ Remove flag de outras imagens ao definir nova
- ✅ Trata rollback de transação em caso de falha

#### ListAnuncioImagesUseCase (5 testes)
- ✅ Lista todas as imagens de um anúncio
- ✅ Erro se anúncio não existe
- ✅ Retorna array vazio se anúncio sem imagens
- ✅ Ordena com imagem primária primeiro
- ✅ Suporta grande número de imagens (20)

### Testes E2E (5 testes)

**Total:** 5 testes passando

- ✅ Rejeita upload sem autenticação
- ✅ Rejeita upload de arquivo inválido
- ✅ Lista imagens de um anúncio
- ✅ Rejeita listagem sem autenticação
- ✅ Retorna 404 para anúncio inexistente

---

## 🔧 Endpoints da API

### Base URL
```
http://localhost:3000 (desenvolvimento)
```

### Autenticação
Todos os endpoints requerem autenticação JWT via header:
```http
Authorization: Bearer {token}
```

---

### 1️⃣ Upload de Imagem

**Endpoint:**
```http
POST /anuncios/:id/images
Content-Type: multipart/form-data
```

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (form-data):**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `file` | File | ✅ Sim | Arquivo de imagem (JPEG, JPG, PNG, WebP) |
| `isPrimary` | Boolean | ❌ Não | Define como imagem primária (default: false) |
| `displayOrder` | Number | ❌ Não | Ordem de exibição (default: 0) |

**Validações:**
- ✅ Tamanho máximo: **10MB**
- ✅ Formatos aceitos: **JPEG, JPG, PNG, WebP**
- ✅ Máximo de imagens por anúncio: **20**
- ✅ Usuário deve estar autenticado

**Response 201 (Sucesso):**
```json
{
  "id": "clxxxx1234",
  "anuncioId": "clyyyy5678",
  "publicId": "anuncios/abc123def456",
  "url": "http://res.cloudinary.com/dtl5wdhnu/image/upload/v1738704000/anuncios/abc123def456.jpg",
  "secureUrl": "https://res.cloudinary.com/dtl5wdhnu/image/upload/v1738704000/anuncios/abc123def456.jpg",
  "format": "jpg",
  "width": 1920,
  "height": 1080,
  "bytes": 245678,
  "displayOrder": 0,
  "isPrimary": true,
  "createdAt": "2026-02-04T12:30:00.000Z",
  "updatedAt": "2026-02-04T12:30:00.000Z"
}
```

**Erros Possíveis:**

| Código | Mensagem | Causa |
|--------|----------|-------|
| 401 | Unauthorized | Token inválido ou ausente |
| 404 | Anúncio com ID {id} não encontrado | Anúncio inexistente |
| 400 | Anúncio já possui o máximo de 20 imagens | Limite atingido |
| 413 | Payload Too Large | Arquivo maior que 10MB |
| 415 | Unsupported Media Type | Formato de arquivo não aceito |

**Exemplo de chamada (cURL):**
```bash
curl -X POST http://localhost:3000/anuncios/cly123/images \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@./casa-praia.jpg" \
  -F "isPrimary=true" \
  -F "displayOrder=0"
```

---

### 2️⃣ Listar Imagens de um Anúncio

**Endpoint:**
```http
GET /anuncios/:id/images
```

**Headers:**
```http
Authorization: Bearer {token}
```

**Response 200 (Sucesso):**
```json
[
  {
    "id": "clxxxx1234",
    "anuncioId": "clyyyy5678",
    "publicId": "anuncios/abc123def456",
    "url": "http://res.cloudinary.com/dtl5wdhnu/image/upload/v1738704000/anuncios/abc123def456.jpg",
    "secureUrl": "https://res.cloudinary.com/dtl5wdhnu/image/upload/v1738704000/anuncios/abc123def456.jpg",
    "format": "jpg",
    "width": 1920,
    "height": 1080,
    "bytes": 245678,
    "displayOrder": 0,
    "isPrimary": true,
    "createdAt": "2026-02-04T12:30:00.000Z",
    "updatedAt": "2026-02-04T12:30:00.000Z"
  },
  {
    "id": "clxxxx9999",
    "anuncioId": "clyyyy5678",
    "publicId": "anuncios/xyz789ghi012",
    "url": "http://res.cloudinary.com/dtl5wdhnu/image/upload/v1738704100/anuncios/xyz789ghi012.jpg",
    "secureUrl": "https://res.cloudinary.com/dtl5wdhnu/image/upload/v1738704100/anuncios/xyz789ghi012.jpg",
    "format": "jpg",
    "width": 1920,
    "height": 1080,
    "bytes": 312456,
    "displayOrder": 1,
    "isPrimary": false,
    "createdAt": "2026-02-04T12:31:00.000Z",
    "updatedAt": "2026-02-04T12:31:00.000Z"
  }
]
```

**Ordenação:** As imagens retornam ordenadas por:
1. `isPrimary` (primária primeiro)
2. `displayOrder` (ordem de exibição)
3. `createdAt` (data de criação)

**Erros Possíveis:**

| Código | Mensagem | Causa |
|--------|----------|-------|
| 401 | Unauthorized | Token inválido ou ausente |
| 404 | Anúncio com ID {id} não encontrado | Anúncio inexistente |

**Exemplo de chamada (cURL):**
```bash
curl -X GET http://localhost:3000/anuncios/cly123/images \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3️⃣ Deletar Imagem

**Endpoint:**
```http
DELETE /anuncios/:id/images/:imageId
```

**Headers:**
```http
Authorization: Bearer {token}
```

**Response 200 (Sucesso):**
```json
{
  "message": "Imagem deletada com sucesso"
}
```

**Comportamento:**
- ✅ Remove imagem do Cloudinary
- ✅ Remove metadata do PostgreSQL
- ✅ Se imagem deletada era primária, define a próxima como primária automaticamente
- ✅ Continua mesmo se delete do Cloudinary falhar (orphan prevention)

**Erros Possíveis:**

| Código | Mensagem | Causa |
|--------|----------|-------|
| 401 | Unauthorized | Token inválido ou ausente |
| 404 | Imagem com ID {imageId} não encontrada | Imagem inexistente ou não pertence ao anúncio |

**Exemplo de chamada (cURL):**
```bash
curl -X DELETE http://localhost:3000/anuncios/cly123/images/clx456 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4️⃣ Definir Imagem Primária

**Endpoint:**
```http
PATCH /anuncios/:id/images/:imageId/primary
```

**Headers:**
```http
Authorization: Bearer {token}
```

**Path Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | ID do anúncio |
| `imageId` | string | ID da imagem a ser definida como primária |

**Sem body necessário** - `imageId` vai no path

**Response 200 (Sucesso):**
```json
{
  "id": "clxxxx1234",
  "anuncioId": "clyyyy5678",
  "publicId": "anuncios/abc123def456",
  "url": "http://res.cloudinary.com/dtl5wdhnu/image/upload/v1738704000/anuncios/abc123def456.jpg",
  "secureUrl": "https://res.cloudinary.com/dtl5wdhnu/image/upload/v1738704000/anuncios/abc123def456.jpg",
  "format": "jpg",
  "width": 1920,
  "height": 1080,
  "bytes": 245678,
  "displayOrder": 0,
  "isPrimary": true,
  "createdAt": "2026-02-04T12:30:00.000Z",
  "updatedAt": "2026-02-04T12:35:00.000Z"
}
```

**Comportamento:**
- ✅ Remove flag `isPrimary` de todas as outras imagens do anúncio
- ✅ Define a nova imagem como `isPrimary: true`
- ✅ Usa transação para garantir atomicidade

**Erros Possíveis:**

| Código | Mensagem | Causa |
|--------|----------|-------|
| 401 | Unauthorized | Token inválido ou ausente |
| 404 | Imagem com ID {imageId} não encontrada | Imagem inexistente ou não pertence ao anúncio |

**Exemplo de chamada (cURL):**
```bash
curl -X PATCH http://localhost:3000/anuncios/cly123/images/clx456/primary \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🧩 Regras de Negócio

### 1. Limite de Imagens
- ✅ Máximo de **20 imagens** por anúncio
- ✅ Tentativa de upload além do limite retorna **400 Bad Request**

### 2. Imagem Primária
- ✅ Apenas **1 imagem** pode ser primária por anúncio
- ✅ Ao definir nova primária, a anterior é automaticamente desmarcada
- ✅ Se deletar imagem primária, a próxima imagem (por displayOrder) torna-se primária

### 3. Validação de Arquivos
- ✅ Tamanho máximo: **10MB**
- ✅ Formatos aceitos: **JPEG, JPG, PNG, WebP**
- ✅ Validação no controller antes de processar

### 4. Autenticação
- ✅ Todos os endpoints requerem **JWT válido**
- ✅ Token deve ser enviado no header `Authorization: Bearer {token}`

### 5. Rollback e Consistência
- ✅ Se upload no Cloudinary funciona mas salvar no DB falha → **delete do Cloudinary**
- ✅ Se delete do Cloudinary falha mas delete do DB funciona → **log de erro mas continua**
- ✅ Transações no DB garantem atomicidade (set primary)

---

## 📂 Estrutura de Arquivos Implementados

```
src/
├── application/
│   ├── ports/
│   │   └── file-storage.interface.ts           # Interface IFileStorageService
│   └── use-cases/
│       └── anuncio-images/
│           ├── upload-anuncio-image.use-case.ts
│           ├── upload-anuncio-image.use-case.spec.ts     ✅ NOVO
│           ├── delete-anuncio-image.use-case.ts
│           ├── delete-anuncio-image.use-case.spec.ts
│           ├── list-anuncio-images.use-case.ts
│           ├── list-anuncio-images.use-case.spec.ts      ✅ NOVO
│           ├── set-primary-image.use-case.ts
│           └── set-primary-image.use-case.spec.ts        ✅ NOVO
│
├── infrastructure/
│   └── file-storage/
│       └── cloudinary/
│           ├── cloudinary.module.ts
│           └── cloudinary.service.ts
│
├── real-estate/
│   ├── real-estate.module.ts                    # Import CloudinaryModule
│   ├── anuncios.controller.ts                   # Endpoints implementados
│   └── dto/
│       ├── upload-image.dto.ts
│       ├── image-response.dto.ts
│       └── set-primary-image.dto.ts
│
└── test/
    └── anuncio-images.e2e-spec.ts               # 5 testes E2E
```

---

## 🧪 Plano de Testes para QA

### Pré-requisitos

1. **Servidor rodando:**
   ```bash
   npm run start:dev
   ```

2. **Banco de dados atualizado:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Variáveis de ambiente configuradas:**
   ```env
   CLOUDINARY_CLOUD_NAME=dtl5wdhnu
   CLOUDINARY_API_KEY=398519331477366
   CLOUDINARY_API_SECRET=02c76UvTJNyX-qPtms6IW_JmaII
   ```

4. **Token de autenticação:**
   - Fazer login via `POST /auth/login`
   - Copiar o `access_token` retornado

---

### Cenários de Teste

#### 🟢 Cenário 1: Upload de Imagem com Sucesso

**Objetivo:** Verificar upload de imagem válida

**Passos:**
1. Criar um anúncio via `POST /anuncios`
2. Fazer upload de uma imagem JPEG (< 10MB) via `POST /anuncios/:id/images`
3. Verificar response 201 com metadata da imagem
4. Verificar que imagem aparece no Cloudinary dashboard
5. Verificar que metadata foi salva no banco via `GET /anuncios/:id/images`

**Resultado Esperado:**
- ✅ Status 201
- ✅ Response contém `id`, `publicId`, `url`, `secureUrl`, `format`, etc.
- ✅ Imagem visível no Cloudinary
- ✅ Metadata no banco de dados

---

#### 🟢 Cenário 2: Upload Múltiplo e Ordenação

**Objetivo:** Verificar upload de múltiplas imagens e ordenação

**Passos:**
1. Criar um anúncio
2. Fazer upload de 3 imagens com diferentes `displayOrder` (0, 1, 2)
3. Definir a primeira como `isPrimary: true`
4. Listar imagens via `GET /anuncios/:id/images`

**Resultado Esperado:**
- ✅ 3 imagens retornadas
- ✅ Primeira imagem tem `isPrimary: true`
- ✅ Ordenação: primária primeiro, depois por displayOrder

---

#### 🔴 Cenário 3: Rejeitar Upload sem Autenticação

**Objetivo:** Verificar validação de autenticação

**Passos:**
1. Tentar upload sem header `Authorization`
2. Verificar response 401

**Resultado Esperado:**
- ✅ Status 401 Unauthorized

---

#### 🔴 Cenário 4: Rejeitar Arquivo Inválido

**Objetivo:** Verificar validação de tipo de arquivo

**Passos:**
1. Tentar upload de arquivo PDF ou TXT
2. Verificar response 415

**Resultado Esperado:**
- ✅ Status 415 Unsupported Media Type
- ✅ Mensagem de erro clara

---

#### 🔴 Cenário 5: Rejeitar Upload Além do Limite

**Objetivo:** Verificar limite de 20 imagens

**Passos:**
1. Criar um anúncio
2. Fazer upload de 20 imagens
3. Tentar fazer upload da 21ª imagem
4. Verificar response 400

**Resultado Esperado:**
- ✅ Status 400 Bad Request
- ✅ Mensagem: "Anúncio já possui o máximo de 20 imagens"

---

#### 🟢 Cenário 6: Definir Imagem Primária

**Objetivo:** Verificar troca de imagem primária

**Passos:**
1. Criar anúncio com 3 imagens (primeira é primária)
2. Definir a segunda como primária via `PATCH /anuncios/:id/images/:imageId/primary`
   - **Nota:** O `imageId` vai no path, NÃO no body. Sem body necessário.
3. Listar imagens e verificar que apenas a segunda é primária

**Resultado Esperado:**
- ✅ Apenas 1 imagem com `isPrimary: true`
- ✅ Primeira imagem agora tem `isPrimary: false`

---

#### 🟢 Cenário 7: Deletar Imagem

**Objetivo:** Verificar exclusão de imagem

**Passos:**
1. Criar anúncio com 2 imagens
2. Deletar uma via `DELETE /anuncios/:id/images/:imageId`
3. Listar imagens e verificar que só resta 1

**Resultado Esperado:**
- ✅ Status 200
- ✅ Imagem removida do banco
- ✅ Imagem removida do Cloudinary (verificar no dashboard)

---

#### 🟢 Cenário 8: Deletar Imagem Primária

**Objetivo:** Verificar comportamento ao deletar primária

**Passos:**
1. Criar anúncio com 3 imagens (primeira é primária)
2. Deletar a primeira imagem
3. Listar imagens e verificar que a segunda agora é primária

**Resultado Esperado:**
- ✅ Primeira imagem deletada
- ✅ Segunda imagem automaticamente torna-se primária

---

#### 🔴 Cenário 9: Rejeitar Upload de Arquivo Grande

**Objetivo:** Verificar limite de tamanho (10MB)

**Passos:**
1. Tentar upload de imagem > 10MB
2. Verificar response 413

**Resultado Esperado:**
- ✅ Status 413 Payload Too Large

---

#### 🔴 Cenário 10: Erro ao Tentar Acessar Anúncio Inexistente

**Objetivo:** Verificar validação de anúncio existente

**Passos:**
1. Tentar upload em anúncio inexistente `POST /anuncios/invalid-id/images`
2. Verificar response 404

**Resultado Esperado:**
- ✅ Status 404 Not Found
- ✅ Mensagem: "Anúncio com ID invalid-id não encontrado"

---

## 🛠️ Ferramentas para Testes

### 1. Postman / Insomnia

**Collection pronta:** (importar JSON abaixo)

```json
{
  "info": {
    "name": "Imobix - Anuncio Images",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Upload Image",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": ""
            },
            {
              "key": "isPrimary",
              "value": "true",
              "type": "text"
            },
            {
              "key": "displayOrder",
              "value": "0",
              "type": "text"
            }
          ]
        },
        "url": {
          "raw": "http://localhost:3000/anuncios/{{anuncioId}}/images",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["anuncios", "{{anuncioId}}", "images"]
        }
      }
    },
    {
      "name": "List Images",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/anuncios/{{anuncioId}}/images",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["anuncios", "{{anuncioId}}", "images"]
        }
      }
    },
    {
      "name": "Delete Image",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/anuncios/{{anuncioId}}/images/{{imageId}}",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["anuncios", "{{anuncioId}}", "images", "{{imageId}}"]
        }
      }
    },
    {
      "name": "Set Primary Image",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"imageId\": \"{{imageId}}\"}"
        },
        "url": {
          "raw": "http://localhost:3000/anuncios/{{anuncioId}}/images/primary",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["anuncios", "{{anuncioId}}", "images", "primary"]
        }
      }
    }
  ]
}
```

**Variáveis de ambiente do Postman:**
```json
{
  "token": "seu-jwt-token-aqui",
  "anuncioId": "id-do-anuncio-criado",
  "imageId": "id-da-imagem-criada"
}
```

---

### 2. cURL (Terminal)

**1. Login e obter token:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","senha":"senha123"}'
```

**2. Criar anúncio:**
```bash
curl -X POST http://localhost:3000/anuncios \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo":"Casa na Praia",
    "tipo":"CASA",
    "endereco":"Rua da Praia, 123",
    "cidade":"Florianópolis",
    "estado":"SC",
    "valor":500000
  }'
```

**3. Upload de imagem:**
```bash
curl -X POST http://localhost:3000/anuncios/SEU_ANUNCIO_ID/images \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@/caminho/para/imagem.jpg" \
  -F "isPrimary=true"
```

**4. Listar imagens:**
```bash
curl -X GET http://localhost:3000/anuncios/SEU_ANUNCIO_ID/images \
  -H "Authorization: Bearer SEU_TOKEN"
```

**5. Deletar imagem:**
```bash
curl -X DELETE http://localhost:3000/anuncios/SEU_ANUNCIO_ID/images/SEU_IMAGE_ID \
  -H "Authorization: Bearer SEU_TOKEN"
```

**6. Definir imagem primária:**
```bash
curl -X PATCH http://localhost:3000/anuncios/SEU_ANUNCIO_ID/images/primary \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageId":"SEU_IMAGE_ID"}'
```

---

### 3. Swagger UI

**URL:** http://localhost:3000/api

**Instruções:**
1. Acessar Swagger UI no navegador
2. Clicar em "Authorize" no topo
3. Inserir token: `Bearer SEU_TOKEN`
4. Testar endpoints diretamente pela interface

---

## 🔍 Verificações no Cloudinary

### Dashboard
- **URL:** https://cloudinary.com/console
- **Login:** Usar credenciais do .env

### O que verificar:
1. **Media Library:**
   - Pasta `anuncios/` deve conter as imagens uploaded
   - Verificar metadata (width, height, bytes, format)

2. **Transformations:**
   - Verificar se `quality: auto` e `fetch_format: auto` estão aplicados

3. **Usage:**
   - Monitorar bandwidth e storage usado

---

## 🐛 Problemas Conhecidos e Limitações

### 1. Sem Suporte a Múltiplo Upload Simultâneo
**Status:** Não implementado nesta versão  
**Workaround:** Fazer uploads sequenciais  
**Planejado para:** Sprint 2

### 2. Sem Crop/Resize no Backend
**Status:** Apenas transformações automáticas do Cloudinary  
**Workaround:** Frontend pode fazer crop antes de enviar  
**Planejado para:** Futuro (Widget do Cloudinary)

### 3. Sem Validação de Ownership
**Status:** Qualquer usuário autenticado pode fazer upload em qualquer anúncio  
**Workaround:** Implementar verificação de `userId` no Use Case  
**Planejado para:** Sprint 2

---

## 📊 Logs e Debugging

### Logs Importantes

**Upload bem-sucedido:**
```
[CloudinaryService] Uploading file to folder: anuncios
[CloudinaryService] Upload successful: anuncios/abc123def456
```

**Rollback executado:**
```
[UploadAnuncioImageUseCase] Rollback: deleting uploaded file
Failed to rollback uploaded file: <error details>
```

**Delete de imagem:**
```
[DeleteAnuncioImageUseCase] Deleting image from storage: anuncios/abc123def456
[DeleteAnuncioImageUseCase] Image deleted successfully
```

---

## ✅ Checklist de Aceitação

Antes de marcar a feature como concluída, verificar:

### Funcionalidades
- [ ] Upload de imagem válida funciona
- [ ] Upload rejeita arquivos inválidos (tipo/tamanho)
- [ ] Limite de 20 imagens é respeitado
- [ ] Listagem retorna imagens ordenadas corretamente
- [ ] Delete remove imagem do Cloudinary e banco
- [ ] Set primary remove flag de outras imagens
- [ ] Imagem primária automática ao deletar primária atual

### Validações
- [ ] Todos os endpoints requerem autenticação
- [ ] Validação de tamanho de arquivo (10MB)
- [ ] Validação de tipo de arquivo (JPEG, PNG, WebP)
- [ ] Validação de anúncio existente
- [ ] Validação de imagem existente e pertence ao anúncio

### Qualidade de Código
- [ ] Testes unitários passando (22/22)
- [ ] Testes E2E passando (5/5)
- [ ] Cobertura ≥ 90% (atual: 100% statements)
- [ ] Sem warnings no console
- [ ] Código segue Clean Architecture

### Performance
- [ ] Upload de imagem < 3 segundos
- [ ] Listagem de 20 imagens < 1 segundo
- [ ] Delete de imagem < 2 segundos

### Segurança
- [ ] Autenticação JWT obrigatória
- [ ] Validação de tipo MIME no backend
- [ ] Rollback em caso de falha
- [ ] Logs não expõem informações sensíveis

---

## 📞 Contatos para Suporte

**Backend Team:**  
- Issues no GitHub do projeto  
- Slack: #backend-dev

**Documentação:**
- [dev.md](./dev.md) - Documentação técnica completa
- [TDD_GUIDE.md](../TDD_GUIDE.md) - Guia de testes

---

## 📝 Notas Finais para QA

1. **Testes automatizados estão rodando:** Executar `npm test` para verificar
2. **Cobertura de código:** Executar `npm test -- --coverage`
3. **Ambiente de testes:** Usar `.env.test` com credenciais de teste
4. **Rollback funciona:** Testar cenários de falha (desconectar internet, etc)
5. **Cloudinary Dashboard:** Verificar imagens órfãs após testes

**Boa sorte nos testes! 🚀**
