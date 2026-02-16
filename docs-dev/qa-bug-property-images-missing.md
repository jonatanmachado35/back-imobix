# 🐛 BUG REPORT: Property Images Upload Not Implemented

**Data**: 16 de fevereiro de 2026  
**Reportado por**: Front-end Team  
**Severidade**: **P1 - ALTA** (Feature faltando)  
**Status**: ⚠️ **CONFIRMADO** - Implementation Gap  
**Componente**: Properties Module - Image Upload

---

## 📋 Sumário

O front-end tentou criar uma propriedade (Property) esperando que pudesse enviar imagens no mesmo request, mas **o backend NÃO possui implementação de upload de imagens para Properties**. 

Existe apenas a implementação para **Anúncios** (diferente de Properties).

---

## 🔍 Análise do Problema

### Curl Usado pelo Front-end

```bash
curl -X 'POST' \
  'https://back-imobix.onrender.com/proprietario/properties' \
  -H 'Content-Type: application/json' \
  -d '{
  "type": "TEMPORADA",
  "title": "Casa na Praia de Jurerê",
  ...
  # ❌ NÃO HÁ CAMPO PARA IMAGENS NO PAYLOAD
}'
```

### O que o Front-end Esperava

O front-end provavelmente esperava um dos seguintes cenários:

**Cenário A: Upload junto com criação (não implementado)**
```bash
POST /proprietario/properties
Content-Type: multipart/form-data

{
  "data": { /* property data */ },
  "images": [file1, file2, file3]
}
```

**Cenário B: Upload separado depois da criação (não implementado)**
```bash
# 1. Criar property
POST /proprietario/properties → retorna { id: "prop-123" }

# 2. Fazer upload de imagens
POST /proprietario/properties/prop-123/images ❌ ENDPOINT NÃO EXISTE
```

---

## ✅ O que Está Implementado (Status Atual)

### Endpoint de Criação de Property - ✅ EXISTE

**Endpoint**: `POST /proprietario/properties`  
**Controller**: [src/interfaces/http/proprietario.controller.ts](src/interfaces/http/proprietario.controller.ts)  
**Use Case**: [src/application/use-cases/properties/create-property.use-case.ts](src/application/use-cases/properties/create-property.use-case.ts)  

```typescript
@Post('properties')
async createProperty(@Request() req, @Body() dto: CreatePropertyDto) {
  // Cria property SEM imagens
  const property = await this.createPropertyUseCase.execute({
    ownerId: req.user.userId,
    type: dto.type,
    title: dto.title,
    // ... outros campos
    // ❌ Não aceita imagens
  });
  return property.toJSON();
}
```

### DTO de Criação - ❌ NÃO TEM CAMPO DE IMAGENS

**Arquivo**: [src/interfaces/http/dto/property.dto.ts](src/interfaces/http/dto/property.dto.ts)

```typescript
export class CreatePropertyDto {
  @IsEnum(PropertyTypeDto)
  type: PropertyTypeDto;
  
  @IsString()
  title: string;
  
  // ... outros campos
  
  // ❌ NÃO EXISTE: images?: string[] ou files?: File[]
}
```

---

## ❌ O que NÃO Está Implementado

### 1. Endpoint de Upload de Imagens para Properties

**Esperado**: `POST /proprietario/properties/:id/images`  
**Status**: ❌ **NÃO EXISTE**

### 2. Use Cases de Property Images

**Esperados**:
- `UploadPropertyImageUseCase` ❌ Não existe
- `DeletePropertyImageUseCase` ❌ Não existe
- `ListPropertyImagesUseCase` ❌ Não existe
- `SetPrimaryPropertyImageUseCase` ❌ Não existe

### 3. Controller de Property Images

**Esperado**: `PropertyImagesController` ou endpoints em `ProprietarioController`  
**Status**: ❌ **NÃO EXISTE**

---

## 🔄 Comparação com Anúncios (Implementado)

O sistema JÁ TEM implementação completa para upload de imagens de **Anúncios**:

### Anúncios - ✅ COMPLETO

**Controller**: [src/real-estate/anuncios.controller.ts](src/real-estate/anuncios.controller.ts)

```typescript
@Controller('anuncios')
export class AnunciosController {
  
  // ✅ Upload de imagem
  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadImage(
    @Param('id') anuncioId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.uploadImageUseCase.execute(anuncioId, file);
  }
  
  // ✅ Listar imagens
  @Get(':id/images')
  async listImages(@Param('id') anuncioId: string) {
    return this.listImagesUseCase.execute(anuncioId);
  }
  
  // ✅ Deletar imagem
  @Delete(':id/images/:imageId')
  async deleteImage(
    @Param('id') anuncioId: string,
    @Param('imageId') imageId: string
  ) {
    return this.deleteImageUseCase.execute(anuncioId, imageId);
  }
  
  // ✅ Definir imagem principal
  @Patch(':id/images/:imageId/primary')
  async setPrimaryImage(
    @Param('id') anuncioId: string,
    @Param('imageId') imageId: string
  ) {
    return this.setPrimaryImageUseCase.execute(anuncioId, imageId);
  }
}
```

**Use Cases Implementados**:
- ✅ [src/application/use-cases/anuncio-images/upload-anuncio-image.use-case.ts](src/application/use-cases/anuncio-images/upload-anuncio-image.use-case.ts)
- ✅ [src/application/use-cases/anuncio-images/delete-anuncio-image.use-case.ts](src/application/use-cases/anuncio-images/delete-anuncio-image.use-case.ts)
- ✅ [src/application/use-cases/anuncio-images/list-anuncio-images.use-case.ts](src/application/use-cases/anuncio-images/list-anuncio-images.use-case.ts)
- ✅ [src/application/use-cases/anuncio-images/set-primary-image.use-case.ts](src/application/use-cases/anuncio-images/set-primary-image.use-case.ts)

---

## 🗄️ Database Schema - ✅ EXISTE

A tabela `PropertyImage` JÁ EXISTE no banco:

```prisma
model PropertyImage {
  id            String    @id @default(cuid())
  propertyId    String
  property      Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  
  publicId      String    @unique
  url           String
  secureUrl     String
  format        String
  width         Int?
  height        Int?
  bytes         Int?
  
  displayOrder  Int       @default(0)
  isPrimary     Boolean   @default(false)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([propertyId])
}

model Property {
  // ...
  images        PropertyImage[]  // ✅ Relação existe
  // ...
}
```

**Status**: ✅ Schema está pronto, falta apenas a implementação dos endpoints e use cases.

---

## 🎯 Impacto

### Impacto Funcional

- ❌ **Front-end BLOQUEADO** para implementar cadastro de propriedades com fotos
- ❌ **Proprietários não conseguem adicionar imagens** às suas propriedades
- ❌ **Listagens de propriedades aparecem SEM FOTOS** (UX ruim)
- ❌ **Feature de temporada incompleta** (imagens são essenciais para conversão)

### Impacto de Negócio

- 🚫 **Funcionalidade de temporada não utilizável** em produção
- 💰 **Perda de conversão** (usuários não alugam sem ver fotos)
- 😞 **Experiência de usuário ruim**
- ⏱️ **Time de desenvolvimento bloqueado** no front-end

---

## ✅ Solução Recomendada

### Implementar Upload de Property Images (Seguir Padrão de Anúncios)

**Prioridade**: 🔥 **URGENTE** - Bloqueando funcionalidade crítica

### Arquivos a Criar

```
src/
├── application/
│   └── use-cases/
│       └── property-images/                        # 🆕 Criar diretório
│           ├── upload-property-image.use-case.ts   # 🆕
│           ├── upload-property-image.use-case.spec.ts
│           ├── delete-property-image.use-case.ts   # 🆕
│           ├── delete-property-image.use-case.spec.ts
│           ├── list-property-images.use-case.ts    # 🆕
│           ├── list-property-images.use-case.spec.ts
│           └── set-primary-property-image.use-case.ts  # 🆕
│
└── interfaces/
    └── http/
        ├── property-images.controller.ts           # 🆕
        └── dto/
            └── property-image.dto.ts               # 🆕
```

### Implementação Sugerida (Copiar de Anúncios)

**1. Use Case: Upload Property Image**

```typescript
// src/application/use-cases/property-images/upload-property-image.use-case.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IFileStorageService, FileUploadDto } from '../../ports/file-storage.interface';

@Injectable()
export class UploadPropertyImageUseCase {
  private readonly MAX_IMAGES_PER_PROPERTY = 20;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(
    propertyId: string,
    ownerId: string, // ✅ Validar ownership
    file: FileUploadDto,
    isPrimary = false,
    displayOrder = 0,
  ) {
    // 1. Validar que property existe e pertence ao owner
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { images: true },
    });

    if (!property) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }

    if (property.ownerId !== ownerId) {
      throw new BadRequestException('You are not the owner of this property');
    }

    // 2. Validar quantidade máxima
    if (property.images.length >= this.MAX_IMAGES_PER_PROPERTY) {
      throw new BadRequestException(
        `Property already has maximum of ${this.MAX_IMAGES_PER_PROPERTY} images`,
      );
    }

    // 3. Upload para Cloudinary
    const uploadResult = await this.fileStorageService.uploadFile({
      file,
      folder: 'imobix/properties',
      publicId: `property-${propertyId}-${Date.now()}`,
    });

    // 4. Se isPrimary=true, remover isPrimary das outras
    if (isPrimary) {
      await this.prisma.propertyImage.updateMany({
        where: {
          propertyId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    // 5. Salvar no banco
    const image = await this.prisma.propertyImage.create({
      data: {
        propertyId,
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
        displayOrder,
        isPrimary,
      },
    });

    return image;
  }
}
```

**2. Controller: Property Images**

```typescript
// src/interfaces/http/property-images.controller.ts

import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UploadPropertyImageUseCase } from '../../application/use-cases/property-images/upload-property-image.use-case';
import { DeletePropertyImageUseCase } from '../../application/use-cases/property-images/delete-property-image.use-case';
import { ListPropertyImagesUseCase } from '../../application/use-cases/property-images/list-property-images.use-case';
import { SetPrimaryPropertyImageUseCase } from '../../application/use-cases/property-images/set-primary-property-image.use-case';

@ApiTags('Proprietário - Property Images')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proprietario/properties/:propertyId/images')
export class PropertyImagesController {
  constructor(
    private readonly uploadImageUseCase: UploadPropertyImageUseCase,
    private readonly deleteImageUseCase: DeletePropertyImageUseCase,
    private readonly listImagesUseCase: ListPropertyImagesUseCase,
    private readonly setPrimaryImageUseCase: SetPrimaryPropertyImageUseCase,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de imagem', description: 'Faz upload de imagem para a propriedade' })
  @ApiResponse({ status: 201, description: 'Imagem enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou limite excedido' })
  @ApiResponse({ status: 403, description: 'Não é o proprietário' })
  @ApiResponse({ status: 404, description: 'Property não encontrada' })
  async uploadImage(
    @Param('propertyId') propertyId: string,
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileDto = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    return this.uploadImageUseCase.execute(
      propertyId,
      req.user.userId, // ownerId para validar ownership
      fileDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar imagens', description: 'Lista todas as imagens da propriedade' })
  @ApiResponse({ status: 200, description: 'Lista de imagens' })
  async listImages(@Param('propertyId') propertyId: string) {
    return this.listImagesUseCase.execute(propertyId);
  }

  @Delete(':imageId')
  @ApiOperation({ summary: 'Deletar imagem', description: 'Remove imagem da propriedade' })
  @ApiResponse({ status: 204, description: 'Imagem deletada' })
  @ApiResponse({ status: 403, description: 'Não é o proprietário' })
  @ApiResponse({ status: 404, description: 'Imagem não encontrada' })
  async deleteImage(
    @Param('propertyId') propertyId: string,
    @Param('imageId') imageId: string,
    @Request() req,
  ) {
    await this.deleteImageUseCase.execute(propertyId, imageId, req.user.userId);
    return { message: 'Image deleted successfully' };
  }

  @Patch(':imageId/primary')
  @ApiOperation({ summary: 'Definir imagem principal', description: 'Define imagem como principal da propriedade' })
  @ApiResponse({ status: 200, description: 'Imagem principal atualizada' })
  async setPrimaryImage(
    @Param('propertyId') propertyId: string,
    @Param('imageId') imageId: string,
    @Request() req,
  ) {
    return this.setPrimaryImageUseCase.execute(propertyId, imageId, req.user.userId);
  }
}
```

**3. Registrar no Module**

```typescript
// src/properties/properties.module.ts (ou criar se não existe)

import { Module } from '@nestjs/common';
import { ProprietarioController } from '../interfaces/http/proprietario.controller';
import { PropertyImagesController } from '../interfaces/http/property-images.controller'; // 🆕
import { DatabaseModule } from '../infrastructure/database/database.module';
import { CloudinaryModule } from '../infrastructure/file-storage/cloudinary/cloudinary.module';

// Use cases existentes
import { CreatePropertyUseCase } from '../application/use-cases/properties/create-property.use-case';
// ... outros

// 🆕 Use cases de imagens
import { UploadPropertyImageUseCase } from '../application/use-cases/property-images/upload-property-image.use-case';
import { DeletePropertyImageUseCase } from '../application/use-cases/property-images/delete-property-image.use-case';
import { ListPropertyImagesUseCase } from '../application/use-cases/property-images/list-property-images.use-case';
import { SetPrimaryPropertyImageUseCase } from '../application/use-cases/property-images/set-primary-property-image.use-case';

@Module({
  imports: [DatabaseModule, CloudinaryModule],
  controllers: [
    ProprietarioController,
    PropertyImagesController, // 🆕
  ],
  providers: [
    // ... use cases existentes
    
    // 🆕 Use cases de imagens
    UploadPropertyImageUseCase,
    DeletePropertyImageUseCase,
    ListPropertyImagesUseCase,
    SetPrimaryPropertyImageUseCase,
  ],
})
export class PropertiesModule {}
```

---

## 🧪 Testes Necessários

### Unit Tests

```typescript
// src/application/use-cases/property-images/upload-property-image.use-case.spec.ts

describe('UploadPropertyImageUseCase', () => {
  it('should upload image successfully', async () => {
    // Test implementation
  });

  it('should throw error if property not found', async () => {
    // Test implementation
  });

  it('should throw error if not property owner', async () => {
    // Test implementation
  });

  it('should throw error if max images exceeded', async () => {
    // Test implementation
  });

  it('should set as primary if isPrimary=true', async () => {
    // Test implementation
  });
});
```

### E2E Tests

```typescript
// test/property-images.e2e-spec.ts

describe('Property Images (E2E)', () => {
  it('POST /proprietario/properties/:id/images - should upload image', async () => {
    // Test implementation
  });

  it('GET /proprietario/properties/:id/images - should list images', async () => {
    // Test implementation
  });

  it('DELETE /proprietario/properties/:id/images/:imageId - should delete image', async () => {
    // Test implementation
  });

  it('PATCH /proprietario/properties/:id/images/:imageId/primary - should set primary', async () => {
    // Test implementation
  });

  it('should reject upload from non-owner', async () => {
    // Test implementation
  });
});
```

---

## 📝 Fluxo Correto para o Front-end (Após Implementação)

```typescript
// 1. Criar property SEM imagens
const propertyResponse = await fetch('/proprietario/properties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'TEMPORADA',
    title: 'Casa na Praia',
    // ... outros dados
  })
});

const property = await propertyResponse.json();
// property.id = "prop-123"

// 2. Fazer upload de cada imagem
for (const imageFile of selectedImages) {
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('isPrimary', imageIndex === 0); // Primeira é primary
  
  await fetch(`/proprietario/properties/${property.id}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
}

// 3. Buscar property com imagens
const fullProperty = await fetch(`/properties/${property.id}`);
// fullProperty contém array de images
```

---

## 📊 Checklist de Implementação

### Domain & Application Layer

- [ ] **1.1** Criar `property-images/` directory em `use-cases/`
- [ ] **1.2** Implementar `UploadPropertyImageUseCase`
- [ ] **1.3** Implementar `DeletePropertyImageUseCase`
- [ ] **1.4** Implementar `ListPropertyImagesUseCase`
- [ ] **1.5** Implementar `SetPrimaryPropertyImageUseCase`
- [ ] **1.6** Escrever unit tests (4 use cases × 5 tests = 20 tests)

### Interface Layer

- [ ] **2.1** Criar `PropertyImagesController`
- [ ] **2.2** Criar DTOs (`PropertyImageDto`, `UploadPropertyImageDto`)
- [ ] **2.3** Configurar `FileInterceptor` e validações
- [ ] **2.4** Adicionar Swagger documentation

### Module Configuration

- [ ] **3.1** Criar ou atualizar `PropertiesModule`
- [ ] **3.2** Registrar controllers
- [ ] **3.3** Registrar use cases como providers
- [ ] **3.4** Configurar CloudinaryModule dependency

### Testing

- [ ] **4.1** Escrever unit tests (~20 tests)
- [ ] **4.2** Escrever E2E tests (~8 tests)
- [ ] **4.3** Testar ownership validation
- [ ] **4.4** Testar max images limit

### Documentation

- [ ] **5.1** Atualizar Swagger
- [ ] **5.2** Documentar fluxo para front-end
- [ ] **5.3** Criar exemplos de curl
- [ ] **5.4** Atualizar README

---

## ⏱️ Estimativa de Esforço

| Tarefa | Estimativa |
|--------|-----------|
| Use Cases implementation | 4 horas |
| Controller + DTOs | 2 horas |
| Unit tests | 3 horas |
| E2E tests | 2 horas |
| Documentation | 1 hora |
| **Total** | **12 horas** (~1.5 dias) |

---

## 🎯 Conclusão

### Resposta à Pergunta Original

> "ele informou que a imagem não foi cadastrada, quero entender se realmente está com erro ou o front fez algo errado."

**Resposta**: ✅ **NÃO é culpa do front-end. É um BUG DE IMPLEMENTATION GAP no backend.**

### Situação Atual

- ✅ Schema do banco PRONTO (`PropertyImage` table exists)
- ✅ Endpoint de criação de property FUNCIONA
- ❌ Endpoints de upload de imagens **NÃO EXISTEM**
- ❌ Use cases de imagens **NÃO IMPLEMENTADOS**

### Ação Necessária

**IMPLEMENTAR** upload de imagens para Properties, seguindo o padrão já estabelecido em Anúncios.

### Prioridade

🔥 **P1 - ALTA** - Bloqueando funcionalidade crítica de temporada.

**Recomendação**: Implementar ANTES de release para produção, pois propriedades sem fotos são inutilizáveis.

---

**Preparado por**: QA Team  
**Data**: 16 de fevereiro de 2026  
**Próximos Passos**: Atribuir para dev backend implementar seguindo checklist acima
