# Arquitetura: Upload de Fotos de Anúncios com Cloudinary

**Data:** 04/02/2026  
**Status:** ✅ Ready for Development  
**Complexidade:** Média  
**Tempo Estimado:** 4-6h

---

## 📋 Contexto

O sistema Imobix precisa permitir que usuários façam upload de fotos ao criar ou editar anúncios de imóveis. O Cloudinary já está configurado nas variáveis de ambiente e existe infraestrutura parcial implementada.

### Situação Atual ✅

**O que JÁ existe:**
- ✅ Cloudinary configurado e credenciais em `.env`
- ✅ `CloudinaryService` implementado (`src/infrastructure/file-storage/cloudinary/`)
- ✅ Schema Prisma com modelo `AnuncioImage` completo
- ✅ Use cases implementados:
  - `UploadAnuncioImageUseCase`
  - `DeleteAnuncioImageUseCase`
  - `ListAnuncioImagesUseCase`
  - `SetPrimaryImageUseCase`
- ✅ Controller `AnunciosController` com endpoints de upload
- ✅ DTOs: `UploadImageDto`, `ImageResponseDto`, `SetPrimaryImageDto`

### O que precisa ser ajustado 🔧

**Apenas ajustes de integração:**
1. Verificar se o módulo Cloudinary está importado corretamente
2. Testar endpoints existentes
3. Documentar fluxo completo
4. Adicionar validações de negócio se necessário

---

## 🏗️ Arquitetura (Clean Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   AnunciosController (HTTP)                           │   │
│  │   - POST /anuncios/:id/images                         │   │
│  │   - GET /anuncios/:id/images                          │   │
│  │   - DELETE /anuncios/:id/images/:imageId              │   │
│  │   - PATCH /anuncios/:id/images/primary                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Use Cases (Business Logic)                          │   │
│  │   - UploadAnuncioImageUseCase                         │   │
│  │   - DeleteAnuncioImageUseCase                         │   │
│  │   - ListAnuncioImagesUseCase                          │   │
│  │   - SetPrimaryImageUseCase                            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Ports (Interfaces)                                  │   │
│  │   - IFileStorageService                               │   │
│  │   - FileUploadDto, UploadResult                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   CloudinaryService (Adapter)                         │   │
│  │   - upload(file, folder)                              │   │
│  │   - delete(publicId)                                  │   │
│  │   - getUrl(publicId, transformations)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   PrismaService (Database)                            │   │
│  │   - anuncio.images (CRUD)                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    External Services
              ┌─────────────┬──────────────┐
              │  Cloudinary │  PostgreSQL  │
              └─────────────┴──────────────┘
```

---

## 🔄 Fluxo de Upload (Sequence Diagram)

```
Cliente → Controller → Use Case → CloudinaryService → Cloudinary API
                           ↓
                      PrismaService → PostgreSQL
                           ↓
                      Cliente (Response)
```

### Detalhamento do Fluxo

**1. Cliente faz upload** 
```http
POST /anuncios/{anuncioId}/images
Content-Type: multipart/form-data

{
  file: <binary>,
  displayOrder: 0,
  isPrimary: true
}
```

**2. Controller recebe e valida**
- `FileInterceptor` processa o multipart
- `ParseFilePipe` valida tamanho e tipo
- Extrai `anuncioId` dos params
- Chama o Use Case

**3. Use Case orquestra lógica de negócio**
```typescript
// Regras de Negócio
- Anúncio deve existir
- Máximo 20 imagens por anúncio
- Se isPrimary=true, desmarcar outras imagens primárias
- Calcular displayOrder se não fornecido
- Em caso de erro no Cloudinary, rollback do banco
```

**4. CloudinaryService faz upload**
- Upload via stream (eficiente para arquivos grandes)
- Transformações automáticas (quality, fetch_format)
- Retorna metadata (publicId, urls, dimensões, etc)

**5. PrismaService salva no banco**
```prisma
AnuncioImage {
  publicId, url, secureUrl, format,
  width, height, bytes,
  displayOrder, isPrimary
}
```

**6. Resposta ao cliente**
```json
{
  "id": "clxxxx",
  "anuncioId": "clyyyy",
  "publicId": "anuncios/abc123",
  "url": "http://...",
  "secureUrl": "https://...",
  "format": "jpg",
  "width": 1920,
  "height": 1080,
  "bytes": 245678,
  "displayOrder": 0,
  "isPrimary": true,
  "createdAt": "2026-02-04T...",
  "updatedAt": "2026-02-04T..."
}
```

---

## 🎯 Decisões de Arquitetura

### 1. Por que Clean Architecture?

**✅ Vantagens:**
- Fácil trocar Cloudinary por S3/MinIO no futuro
- Use Cases testáveis sem dependências externas
- Lógica de negócio isolada
- Manutenibilidade a longo prazo

**⚠️ Trade-offs:**
- Mais arquivos/camadas (overhead inicial)
- Curva de aprendizado para desenvolvedores novos

**💡 Decisão:** Mantemos Clean Architecture porque já está implementada e o projeto tem potencial de crescimento.

---

### 2. Por que Cloudinary vs S3/MinIO?

| Critério | Cloudinary | AWS S3 | MinIO |
|----------|-----------|--------|-------|
| **Setup** | ✅ Simples (já configurado) | ⚠️ Médio | ⚠️ Requer infraestrutura |
| **Transformações** | ✅ Automáticas | ❌ Precisa Lambda/função | ❌ Manual |
| **CDN** | ✅ Incluído | ⚠️ CloudFront separado | ❌ Precisa configurar |
| **Custo (até 25GB)** | ✅ Grátis | ⚠️ Pago (barato) | ✅ Grátis (self-hosted) |
| **Vendor Lock-in** | ⚠️ Alto | ⚠️ Médio | ✅ Baixo |

**💡 Decisão:** Cloudinary para MVP/início. Migrar para S3 se ultrapassar 25GB/mês ou precisar controle total de custos.

---

### 3. Por que Upload via Stream vs Buffer?

```typescript
// ✅ Stream (implementado)
cloudinary.uploader.upload_stream(options, callback)
  .end(file.buffer)

// ❌ File Path (não usar)
cloudinary.uploader.upload(filepath, options)
```

**✅ Vantagens Stream:**
- Não salva arquivo temporário em disco
- Suporta arquivos grandes (até 100MB)
- Menor uso de memória
- Funciona em containers stateless

**💡 Decisão:** Manter stream. Único caso para filepath seria batch upload de milhares de imagens locais.

---

### 4. Limite de 20 Imagens por Anúncio

**Regra implementada:**
```typescript
private readonly MAX_IMAGES_PER_ANUNCIO = 20;
```

**Justificativa:**
- Sites concorrentes: Airbnb (50), Booking (40), OLX (20)
- UX: mais de 20 imagens confunde usuário
- Performance: carregamento de galeria
- Custo: limitar uso de storage

**⚠️ Flexibilização futura:**
```typescript
// Pode ser configurável por plano:
// - Plano Free: 10 imagens
// - Plano Pro: 30 imagens
// - Plano Enterprise: ilimitado
```

---

### 5. Imagem Primária (isPrimary)

**Comportamento:**
- Apenas 1 imagem pode ser primária por anúncio
- Usada em listings/cards de busca
- Automático: primeira imagem uploaded é primária

**Implementação:**
```typescript
// SetPrimaryImageUseCase
if (isPrimary) {
  // Desmarcar todas as outras
  await prisma.anuncioImage.updateMany({
    where: { anuncioId, isPrimary: true },
    data: { isPrimary: false }
  });
  
  // Marcar a nova
  await prisma.anuncioImage.update({
    where: { id: imageId },
    data: { isPrimary: true }
  });
}
```

---

### 6. Transformações de Imagem

**Aplicadas automaticamente:**
```typescript
transformation: [
  { quality: 'auto' },      // Cloudinary escolhe qualidade ideal
  { fetch_format: 'auto' }, // WebP para browsers modernos
]
```

**Futuras otimizações:**
```typescript
// Criar múltiplas versões:
// - thumbnail: 300x200
// - medium: 800x600
// - large: 1920x1080
// - original: sem transformação

// Usar na listagem:
// <img src="${cloudinary_url}/w_300,h_200,c_fill/anuncios/abc123.jpg">
```

**💡 Decisão:** Por enquanto, deixar Cloudinary fazer auto-otimização. Adicionar versões específicas quando tiver métricas de performance.

---

## 🔐 Validações e Segurança

### 1. Validações no Controller (Presentation Layer)

```typescript
@UseInterceptors(FileInterceptor('file'))
@UploadedFile(
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
      new FileTypeValidator({ fileType: /image\/(jpeg|jpg|png|webp)/ }),
    ],
  }),
)
```

**O que valida:**
- ✅ Tamanho máximo: 10MB
- ✅ Tipos permitidos: JPEG, PNG, WebP
- ✅ Arquivo deve existir

---

### 2. Validações no Use Case (Business Layer)

```typescript
// UploadAnuncioImageUseCase
1. Anúncio existe?
2. Usuário tem permissão? (futuro: verificar ownership)
3. Limite de 20 imagens não ultrapassado?
4. Se isPrimary=true, desmarcar outras
5. Calcular displayOrder se não fornecido
```

---

### 3. Validações no Service (Infrastructure Layer)

```typescript
// CloudinaryService
1. File.buffer não está vazio
2. Formato permitido pelo Cloudinary
3. Tratamento de erros da API
```

---

### 4. Segurança

**✅ Já implementado:**
- `@UseGuards(JwtAuthGuard)` - autenticação obrigatória
- Upload via stream (sem salvar em disco)
- HTTPS obrigatório (secure: true)

**⚠️ Melhorias futuras:**
```typescript
// 1. Verificar ownership
const anuncio = await prisma.anuncio.findFirst({
  where: { 
    id: anuncioId,
    userId: currentUser.id // Apenas dono pode fazer upload
  }
});

// 2. Rate limiting
@Throttle(5, 60) // 5 uploads por minuto

// 3. Scan de vírus (ClamAV)
await virusScanner.scan(file.buffer);

// 4. Content Moderation (Cloudinary Moderation Add-on)
transformation: [
  { moderation: 'aws_rek:explicit_nudity' }
]
```

---

## 🧪 Testes

### 1. Testes E2E (já existem)

```bash
# Rodar testes existentes
npm run test:e2e test/anuncio-images.e2e-spec.ts
```

**Cobertura atual:**
- ✅ Upload de imagem válida
- ✅ Upload com arquivo inválido (tamanho/tipo)
- ✅ Upload sem autenticação
- ✅ Delete de imagem
- ✅ Listar imagens
- ✅ Set primary image

---

### 2. Testes Unitários (criar se necessário)

```typescript
// upload-anuncio-image.use-case.spec.ts
describe('UploadAnuncioImageUseCase', () => {
  it('deve lançar erro se anúncio não existe', async () => {
    // Arrange
    const anuncioId = 'invalid-id';
    
    // Act & Assert
    await expect(
      useCase.execute(anuncioId, mockFile)
    ).rejects.toThrow(NotFoundException);
  });

  it('deve lançar erro se atingir limite de 20 imagens', async () => {
    // Arrange: anúncio com 20 imagens
    
    // Act & Assert
    await expect(
      useCase.execute(anuncioId, mockFile)
    ).rejects.toThrow(BadRequestException);
  });

  it('deve desmarcar outras imagens se isPrimary=true', async () => {
    // Arrange: anúncio com 1 imagem primária
    
    // Act: upload nova imagem como primária
    await useCase.execute(anuncioId, mockFile, true);
    
    // Assert: apenas 1 imagem primária
    const images = await prisma.anuncioImage.findMany({
      where: { anuncioId, isPrimary: true }
    });
    expect(images).toHaveLength(1);
  });
});
```

---

## 📝 Checklist de Implementação

### ✅ Já Implementado

- [x] Schema Prisma com `AnuncioImage`
- [x] CloudinaryService (Infrastructure)
- [x] IFileStorageService (Port/Interface)
- [x] DTOs (Upload, Response, SetPrimary)
- [x] Use Cases (Upload, Delete, List, SetPrimary)
- [x] Controller com endpoints
- [x] Testes E2E

### 🔧 Verificações Necessárias

- [ ] **1. Verificar módulos importados**
  ```typescript
  // real-estate.module.ts deve importar:
  import { CloudinaryModule } from '../infrastructure/file-storage/cloudinary/cloudinary.module';
  
  @Module({
    imports: [CloudinaryModule],
    controllers: [AnunciosController],
    providers: [
      RealEstateService,
      UploadAnuncioImageUseCase,
      DeleteAnuncioImageUseCase,
      ListAnuncioImagesUseCase,
      SetPrimaryImageUseCase,
    ],
  })
  ```

- [ ] **2. Verificar variáveis de ambiente**
  ```bash
  # .env deve ter:
  CLOUDINARY_CLOUD_NAME=xxx
  CLOUDINARY_API_KEY=xxx
  CLOUDINARY_API_SECRET=xxx
  ```

- [ ] **3. Testar endpoints manualmente**
  ```bash
  # 1. Criar anúncio
  curl -X POST http://localhost:3000/anuncios \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"titulo":"Casa Praia","tipo":"CASA","endereco":"Rua X","cidade":"Floripa","estado":"SC","valor":500000}'
  
  # 2. Upload imagem
  curl -X POST http://localhost:3000/anuncios/{id}/images \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@./test-image.jpg" \
    -F "isPrimary=true"
  
  # 3. Listar imagens
  curl http://localhost:3000/anuncios/{id}/images \
    -H "Authorization: Bearer $TOKEN"
  
  # 4. Deletar imagem
  curl -X DELETE http://localhost:3000/anuncios/{id}/images/{imageId} \
    -H "Authorization: Bearer $TOKEN"
  ```

- [ ] **4. Rodar testes E2E**
  ```bash
  npm run test:e2e test/anuncio-images.e2e-spec.ts
  ```

- [ ] **5. Documentar no Swagger**
  - Verificar se exemplos aparecem corretamente
  - Testar upload via Swagger UI

---

## 🚀 Deploy e Produção

### Variáveis de Ambiente

```bash
# .env.production
CLOUDINARY_CLOUD_NAME=imobix-prod
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Opcional: folder diferente em produção
CLOUDINARY_FOLDER=anuncios-prod
```

---

### Monitoramento

**Métricas importantes:**
```typescript
// Adicionar no CloudinaryService
private uploadMetrics = {
  totalUploads: 0,
  totalBytes: 0,
  failedUploads: 0,
  averageTime: 0
};

async upload(file: FileUploadDto) {
  const startTime = Date.now();
  
  try {
    const result = await this.uploadToCloudinary(file);
    
    // Registrar sucesso
    this.uploadMetrics.totalUploads++;
    this.uploadMetrics.totalBytes += result.bytes;
    this.uploadMetrics.averageTime = 
      (this.uploadMetrics.averageTime + (Date.now() - startTime)) / 2;
    
    return result;
  } catch (error) {
    this.uploadMetrics.failedUploads++;
    throw error;
  }
}
```

**Dashboard Cloudinary:**
- Acessar: https://cloudinary.com/console
- Monitorar: Bandwidth, Transformations, Storage

---

### Backups

**Imagens no Cloudinary:**
- Cloudinary faz backup automático
- Exportar via Admin API se necessário

**Metadata no PostgreSQL:**
```sql
-- Backup da tabela AnuncioImage
pg_dump -t AnuncioImage imobix_db > anuncio_images_backup.sql
```

---

## 🔄 Evolução Futura

### Fase 2: Otimizações

1. **Multiple Upload**
   ```typescript
   // Subir várias imagens de uma vez
   POST /anuncios/{id}/images/batch
   Body: { files: File[] }
   ```

2. **Drag & Drop Reordenação**
   ```typescript
   PATCH /anuncios/{id}/images/reorder
   Body: { imageIds: ['id1', 'id2', 'id3'] }
   ```

3. **Responsive Images**
   ```typescript
   // Gerar srcset automaticamente
   <img 
     src="${url}/w_800/image.jpg"
     srcset="
       ${url}/w_400/image.jpg 400w,
       ${url}/w_800/image.jpg 800w,
       ${url}/w_1200/image.jpg 1200w
     "
   />
   ```

---

### Fase 3: Features Avançadas

1. **Image Editing**
   - Crop, rotate, filters
   - Usar Cloudinary Widget ou lib de frontend

2. **AI Tagging**
   ```typescript
   // Cloudinary auto-tagging
   transformation: [
     { effect: 'auto_tagging:0.6' } // Tags automáticas
   ]
   
   // Salvar tags no banco
   AnuncioImage {
     ...
     tags: ['praia', 'piscina', 'quarto'] 
   }
   ```

3. **Content Moderation**
   - Detectar conteúdo impróprio
   - Aprovar/rejeitar automaticamente

---

## 📚 Referências

**Documentação:**
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)
- [Prisma Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)

**Código existente:**
- [src/infrastructure/file-storage/cloudinary/cloudinary.service.ts](../src/infrastructure/file-storage/cloudinary/cloudinary.service.ts)
- [src/application/use-cases/anuncio-images/](../src/application/use-cases/anuncio-images/)
- [src/real-estate/anuncios.controller.ts](../src/real-estate/anuncios.controller.ts)

**Guias relacionados:**
- [FEATURE_UPLOAD_IMPLEMENTATION_SUMMARY.md](../FEATURE_UPLOAD_IMPLEMENTATION_SUMMARY.md)
- [TDD_GUIDE.md](../TDD_GUIDE.md)

---

## 🆘 Troubleshooting

### Erro: "Cloudinary credentials not found"

**Solução:**
```bash
# Verificar .env
cat .env | grep CLOUDINARY

# Reiniciar servidor
npm run start:dev
```

---

### Erro: "File too large"

**Causa:** Limite de 10MB no controller

**Solução:**
```typescript
// Aumentar limite se necessário
new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }) // 20MB
```

---

### Erro: "Invalid image format"

**Causa:** Upload de arquivo não-imagem

**Solução:**
```typescript
// Validação já existe no controller
new FileTypeValidator({ 
  fileType: /image\/(jpeg|jpg|png|webp)/ 
})

// Se precisar aceitar mais formatos:
fileType: /image\/(jpeg|jpg|png|webp|gif|svg)/ 
```

---

### Performance: Upload lento

**Diagnóstico:**
```bash
# Testar velocidade de upload
time curl -X POST http://localhost:3000/anuncios/{id}/images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./large-image.jpg"
```

**Otimizações:**
1. Redimensionar no frontend antes do upload
2. Usar WebP (menor tamanho)
3. Cloudinary auto-otimização já ativada

---

## ✅ Resumo Executivo

**O que temos:**
- ✅ Arquitetura completa implementada (Clean Architecture)
- ✅ Cloudinary configurado e integrado
- ✅ Endpoints funcionais
- ✅ Testes E2E criados

**O que fazer:**
1. Verificar importação do `CloudinaryModule` no `RealEstateModule`
2. Confirmar variáveis de ambiente
3. Testar endpoints manualmente
4. Rodar testes E2E
5. Deploy e monitoramento

**Tempo estimado:** 2-4h (apenas verificações e testes)

**Complexidade:** 🟢 Baixa (infra já pronta, só validar)

---

## 🎯 Critérios de Sucesso

- [ ] Upload de imagem funciona via API
- [ ] Imagens aparecem no Cloudinary dashboard
- [ ] Metadata salva corretamente no PostgreSQL
- [ ] Delete remove do Cloudinary e do banco
- [ ] Apenas 1 imagem primária por anúncio
- [ ] Limite de 20 imagens respeitado
- [ ] Testes E2E passando 100%
- [ ] Documentação Swagger atualizada

---

**Dúvidas ou problemas?**  
Consultar:
1. Este documento
2. Código existente em `src/`
3. Testes em `test/anuncio-images.e2e-spec.ts`
4. Documentação oficial Cloudinary

**Próximos passos após validação:**
→ Implementar upload múltiplo (batch)  
→ Adicionar reordenação drag & drop  
→ Otimizar transformações de imagem
