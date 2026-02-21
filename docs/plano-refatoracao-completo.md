# 📋 PLANO COMPLETO DE REFATORAÇÃO - IMOBIX

## Visão Geral

Este documento contém todas as correções e melhorias arquiteturais necessárias para o projeto. Organize as tarefas em sprints de 1 semana cada.

---

## 📅 SPRINT 1: Corrigir Repository Pattern

### Objetivo
Implementar Repository Pattern para todos os domínios que ainda acessam Prisma diretamente.

---

### Tarefa 1.1: Criar AnuncioRepository

**Problema:** O `RealEstateService` acessa Prisma diretamente sem usar repository.

**Passo 1:** Criar interface em `src/application/ports/`

```typescript
// src/application/ports/anuncio-repository.ts
import { Anuncio, Prisma } from '@prisma/client';

export interface AnuncioRepository {
  findAll(props?: { includeImages?: boolean }): Promise<Anuncio[]>;
  findById(id: string): Promise<Anuncio | null>;
  create(data: Prisma.AnuncioCreateInput): Promise<Anuncio>;
  update(id: string, data: Prisma.AnuncioUpdateInput): Promise<Anuncio>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: string): Promise<Anuncio>;
}
```

**Passo 2:** Criar implementação em `src/infrastructure/database/`

```typescript
// src/infrastructure/database/prisma-anuncio.repository.ts
import { Injectable } from '@nestjs/common';
import { AnuncioRepository } from '../../application/ports/anuncio-repository';
import { PrismaService } from './prisma.service';
import { Anuncio, Prisma } from '@prisma/client';

@Injectable()
export class PrismaAnuncioRepository implements AnuncioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(props?: { includeImages?: boolean }): Promise<Anuncio[]> {
    return this.prisma.anuncio.findMany({
      include: props?.includeImages ? { images: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Anuncio | null> {
    return this.prisma.anuncio.findUnique({ where: { id } });
  }

  async create(data: Prisma.AnuncioCreateInput): Promise<Anuncio> {
    return this.prisma.anuncio.create({ data });
  }

  async update(id: string, data: Prisma.AnuncioUpdateInput): Promise<Anuncio> {
    return this.prisma.anuncio.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.anuncio.delete({ where: { id } });
  }

  async updateStatus(id: string, status: string): Promise<Anuncio> {
    return this.prisma.anuncio.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
```

**Passo 3:** Registrar no módulo

```typescript
// src/real-estate/real-estate.module.ts
import { PrismaAnuncioRepository } from '../infrastructure/database/prisma-anuncio.repository';

@Module({
  providers: [
    RealEstateService,
    PrismaAnuncioRepository,  // Adicionar
  ],
  exports: [RealEstateService, PrismaAnuncioRepository],
})
export class RealEstateModule {}
```

**Passo 4:** Atualizar RealEstateService para usar repository

```typescript
// src/real-estate/real-estate.service.ts
@Injectable()
export class RealEstateService {
  constructor(
    private readonly anuncioRepository: AnuncioRepository,  // Injetar
  ) {}

  async findAll() {
    return this.anuncioRepository.findAll({ includeImages: true });
  }

  async findById(id: string) {
    return this.anuncioRepository.findById(id);
  }

  async create(data: any) {
    return this.anuncioRepository.create(data);
  }

  async update(id: string, data: any) {
    return this.anuncioRepository.update(id, data);
  }

  async delete(id: string) {
    return this.anuncioRepository.delete(id);
  }

  async updateStatus(id: string, status: string) {
    return this.anuncioRepository.updateStatus(id, status);
  }
}
```

---

### Tarefa 1.2: Criar FinanceRepository

**Problema:** `FinanceService` acessa Prisma diretamente.

**Arquivo:** `src/application/ports/finance-repository.ts`

```typescript
import { Transacao } from '@prisma/client';

export interface FinanceRepository {
  findAllTransacoes(userId: string): Promise<Transacao[]>;
  findResumo(userId: string): Promise<{
    totalReceitas: number;
    totalDespesas: number;
    saldo: number;
  }>;
}
```

**Implementação:** `src/infrastructure/database/prisma-finance.repository.ts`

**Atualizar:** `src/finance/finance.service.ts`

---

### Tarefa 1.3: Criar CalendarRepository

**Problema:** `CalendarService` acessa Prisma diretamente.

**Arquivo:** `src/application/ports/calendar-repository.ts`

```typescript
import { Reserva, Visita } from '@prisma/client';

export interface CalendarRepository {
  findReservas(userId: string, start?: Date, end?: Date): Promise<Reserva[]>;
  findVisitas(userId: string, start?: Date, end?: Date): Promise<Visita[]>;
}
```

---

### Tarefa 1.4: Criar PeopleRepository

**Problema:** `PeopleService` acessa Prisma diretamente com lógica de negócio.

**Arquivo:** `src/application/ports/people-repository.ts`

```typescript
import { Funcionario, Corretor } from '@prisma/client';

export interface PeopleRepository {
  findAllFuncionarios(): Promise<Funcionario[]>;
  findFuncionarioById(id: string): Promise<Funcionario | null>;
  createFuncionario(data: any): Promise<Funcionario>;
  findAllCorretores(): Promise<Corretor[]>;
  findCorretorById(id: string): Promise<Corretor | null>;
  createCorretor(data: any): Promise<Corretor>;
}
```

---

## 📅 SPRINT 2: Limpar Use Cases de Imagens

### Objetivo
Corrigir injeção de dependência nos use cases de imagens.

---

### Tarefa 2.1: Corrigir PropertyImageUseCases

**Problema:** Use cases de imagens injetam Prisma diretamente.

**Arquivo:** `src/application/use-cases/property-images/add-property-image.use-case.ts`

**Antes (ERRADO):**
```typescript
export class AddPropertyImageUseCase {
  constructor(
    private readonly fileStorage: IFileStorageService,
    private readonly prisma: PrismaService,  // ❌ ERRADO
  ) {}
}
```

**Depois (CORRETO):**
```typescript
export class AddPropertyImageUseCase {
  constructor(
    private readonly fileStorage: IFileStorageService,
    private readonly propertyRepository: PropertyRepository,  // ✅ CORRETO
  ) {}

  async execute(propertyId: string, file: any) {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) throw new NotFoundError();
    // ...
  }
}
```

**Repetir para todos os use cases em:**
- `src/application/use-cases/property-images/*.ts`
- `src/application/use-cases/anuncio-images/*.ts`

---

### Tarefa 2.2: Criar Use Cases para Finance e Calendar

Se não existirem, criar use cases para estas áreas:

```
src/application/use-cases/
├── finance/
│   ├── get-transactions.use-case.ts
│   └── get-summary.use-case.ts
└── calendar/
    ├── get-events.use-case.ts
    └── get-eventos.use-case.ts
```

---

## 📅 SPRINT 3: Reduzir Controllers

### Objetivo
Extrair lógica de negócio dos controllers e eliminar código duplicado.

---

### Tarefa 3.1: Extrair toResponseDto para Mapper Compartilhado

**Problema:** Método duplicado em 3 controllers.

**Criar arquivo:** `src/interfaces/http/mappers/booking.mapper.ts`

```typescript
import { Booking } from '@prisma/client';

export class BookingMapper {
  static toResponseDto(booking: Booking & { property?: any; user?: any }) {
    return {
      id: booking.id,
      propertyId: booking.propertyId,
      userId: booking.userId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      status: booking.status,
      totalPrice: booking.totalPrice,
      property: booking.property ? {
        id: booking.property.id,
        title: booking.property.title,
      } : undefined,
      createdAt: booking.createdAt,
    };
  }
}
```

**Atualizar controllers:**

```typescript
// bookings.controller.ts
import { BookingMapper } from '../mappers/booking.mapper';

// Substituir método toResponseDto por:
const response = BookingMapper.toResponseDto(booking);
```

**Repetir em:**
- `src/interfaces/http/bookings.controller.ts`
- `src/interfaces/http/owner-bookings.controller.ts`
- `src/interfaces/http/activities.controller.ts`

---

### Tarefa 3.2: Mover Validação de MIME Type para Use Case

**Problema:** Validação de tipo de arquivo no controller.

**Criar:** `src/application/use-cases/property-images/validate-image-file.use-case.ts`

```typescript
import { BadRequestException, Injectable } from '@nestjs/common';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class ValidateImageFileUseCase {
  execute(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido. Use: JPEG, PNG ou WebP');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Arquivo muito grande. Máximo: 10MB');
    }
  }
}
```

**Atualizar:** `src/interfaces/http/proprietario.controller.ts`

```typescript
import { ValidateImageFileUseCase } from '../../application/use-cases/property-images/validate-image-file.use-case';

constructor(
  // ...
  private readonly validateImageFile: ValidateImageFileUseCase,
) {}

@Post('properties/:id/images')
async uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
  this.validateImageFile.execute(file);  // Agora é uma linha simples
  // ...
}
```

**Repetir em:** `src/interfaces/http/anuncios.controller.ts`

---

### Tarefa 3.3: Mover Validação de CSV para Use Case

**Problema:** Lógica de validação CSV no controller.

**Criar:** `src/application/use-cases/leads/import-leads.use-case.ts`

Mover a lógica de parsing CSV do `leads.controller.ts` para cá.

---

### Tarefa 3.4: Quebrar LeadsController (Opcional)

Se o controller ficar muito grande, separar em:

- `src/interfaces/http/leads.controller.ts` (CRUD básico)
- `src/interfaces/http/lead-import.controller.ts` (importação CSV)
- `src/interfaces/http/lead-conversion.controller.ts` (qualify, convert, etc)

---

## 📅 SPRINT 4: Consistência

### Objetivo
Padronizar e eliminar inconsistências.

---

### Tarefa 4.1: Consolidar Arquivos de Erros

**Problema:** `LeadNotFoundError` existe em 2 lugares.

**Verificar:**
```bash
grep -r "LeadNotFoundError" src/
```

**Consolidar:**
- Manter apenas em `src/domain/entities/lead-errors.ts`
- Remover duplicado em `src/application/use-cases/lead-errors.ts`
- Atualizar imports em todos os arquivos

**Repetir para outros erros duplicados.**

---

### Tarefa 4.2: Corrigir Type Casting

**Problema:** `(this.prisma.user as any)`

**Arquivo:** `src/infrastructure/database/prisma-user.repository.ts:41`

```typescript
// Antes
const user = await (this.prisma.user as any).findUnique({...})

// Depois - usar tipo correto
const user = await this.prisma.user.findUnique({...})
```

Se o tipo não existe, verificar o schema Prisma ou criar extensão de tipo.

---

### Tarefa 4.3: Remover Código Comentado

**Arquivo:** `src/calendar/calendar.service.ts`

Remover linhas comentadas:
```typescript
// where: { checkIn: { gte: start }, checkOut: { lte: end } }
```

Procurar por outros códigos comentados:
```bash
grep -r "// " src/ --include="*.ts" | grep -v "// src/" | head -20
```

---

### Tarefa 4.4: Padronizar Nomenclatura

| Atualmente | Padronizar para |
|-----------|-----------------|
| `name` (em RegisterDto) | `nome` |
| `role` (em RegisterDto) | `userRole` |

**Verificar:** `src/auth/dto/register.dto.ts`

---

## 📅 VERIFICAÇÕES PÓS-REFATORAÇÃO

Após cada sprint, verificar:

### Verificação 1: Swagger
```bash
npm run start:dev
# Acessar http://localhost:3000/docs
```

- [ ] Todos os endpoints aparecem corretamente
- [ ] Schemas estão consistentes
- [ ] Não há endpoints duplicados

### Verificação 2: Testes
```bash
npm test
```

- [ ] Todos os testes passam
- [ ] Não há erros de typeScript

### Verificação 3: Build
```bash
npm run build
```

- [ ] Build completa sem erros
- [ ] Nenhum warning crítico

---

## 📊 RESUMO DE ARQUIVOS A CRIAR

```
src/application/ports/
├── anuncio-repository.ts        [NOVA]
├── finance-repository.ts        [NOVA]
├── calendar-repository.ts       [NOVA]
└── people-repository.ts         [NOVA]

src/infrastructure/database/
├── prisma-anuncio.repository.ts [NOVA]
├── prisma-finance.repository.ts [NOVA]
├── prisma-calendar.repository.ts [NOVA]
└── prisma-people.repository.ts  [NOVA]

src/interfaces/http/
├── mappers/
│   ├── booking.mapper.ts        [NOVA]
│   └── (outros se necessário)   [NOVA]
└── validators/
    └── image-file.validator.ts   [NOVA]

src/application/use-cases/
├── property-images/
│   └── validate-image-file.use-case.ts [NOVA]
└── finance/                     [NOVO DIRETÓRIO se não existir]
    └── ...
```

---

## 📋 CHECKLIST FINAL

Ao final de todas as refatorações:

- [ ] Todo acesso ao banco via Repository Pattern
- [ ] Controllers apenas recebem requests e delegam
- [ ] Use cases contêm lógica de negócio
- [ ] Services são "thin wrappers"
- [ ] Não há código duplicado
- [ ] Erros centralizados por domínio
- [ ] Sem type casting desnecessário
- [ ] Sem código comentado em produção

---

## 📝 NOTAS ADICIONAIS

### Sobre os Use Cases Existentes
Manter a estrutura atual de use cases. Não criar use cases para operações simples de leitura se já existirem services funcionais.

### Sobre os Módulos
Os módulos existentes (real-estate, finance, calendar, people) podem continuar existindo, mas devem usar repositories internamente.

### Sobre Testes
Ao refatorar, manter ou criar testes para:
- Use cases
- Repositories
- Mappers

---

## 🚀 ORDEM RECOMENDADA

1. Sprint 1: AnuncioRepository (mais crítico)
2. Sprint 1: Demais repositories
3. Sprint 2: Corrigir use cases de imagens
4. Sprint 3: Extrair toResponseDto
5. Sprint 3: Mover validações
6. Sprint 4: Limpeza final

---

**Documento gerado automaticamente para a equipe de desenvolvimento.**
