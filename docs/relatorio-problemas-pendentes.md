# 📋 RELATÓRIO DE PROBLEMAS PENDENTES - REFATORAÇÃO IMOBIX

## Data: 21/02/2026
## Status: Refatoração Concluída | Testes Necesários Ajustes

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. Repository Pattern (Sprint 1)
- [x] `AnuncioRepository` - interface e implementação
- [x] `FinanceRepository` - interface e implementação
- [x] `CalendarRepository` - interface e implementação
- [x] `PeopleRepository` - interface e implementação
- [x] Services atualizados para usar injeção de dependência
- [x] Tokens de injeção criados

### 2. Use Cases de Imagens (Sprint 2)
- [x] UploadPropertyImageUseCase
- [x] ListPropertyImagesUseCase
- [x] DeletePropertyImageUseCase
- [x] SetPrimaryPropertyImageUseCase
- [x] UploadAnuncioImageUseCase
- [x] Todos usando PropertyRepository/AnuncioRepository

### 3. Controllers e Mappers (Sprint 3)
- [x] BookingMapper criado (src/interfaces/http/mappers/booking.mapper.ts)
- [x] ValidateImageFileUseCase criado
- [x] Controllers simplificados

### 4. Consistência (Sprint 4)
- [x] Erros de Lead consolidados em domain/entities/lead-errors.ts
- [x] Type casting desnecessário removido

---

## ❌ PROBLEMAS PENDENTES

### 1. Testes Unitários - Falta Atualizar Mocks

Alguns testes unitários ainda precisam de ajustes nos mocks para incluir os novos métodos de repository.

#### Arquivos que precisam de correção:

| Arquivo | Problema |
|---------|----------|
| `src/application/use-cases/anuncio-images/*.spec.ts` | Usar token `ANUNCIO_REPOSITORY` nos mocks |
| `src/application/use-cases/property-images/*.spec.ts` | Verificar se estão usando o novo padrão |

#### Solução:
Atualizar os testes para usar os tokens de injeção:

```typescript
// Antes
{
  provide: 'AnuncioRepository',
  useValue: mockAnuncioRepository,
}

// Depois
import { ANUNCIO_REPOSITORY } from '../../../real-estate/real-estate.tokens';

{
  provide: ANUNCIO_REPOSITORY,
  useValue: mockAnuncioRepository,
}
```

---

### 2. Testes E2E - Problema de Conexões

Os testes E2E estão falhando com erro:
```
PrismaClientInitializationError: Too many database connections opened: 
FATAL: remaining connection slots are reserved for roles with the SUPERUSER attribute
```

#### Causa:
- Muitos testes executando em paralelo
- Limite de conexões do banco de teste (Supabase)
- Falta cleanup adequado entre testes

#### Soluções Possíveis:

1. **Aumentar pool de conexões** (se possível no plano):
   ```typescript
   // prisma/service.ts
   constructor() {
     super({
       log: ['error', 'warn'],
       datasources: {
         db: {
           url: process.env.DATABASE_URL,
         },
       },
     });
   }
   ```

2. **Adicionar `afterAll` com cleanup**:
   ```typescript
   afterAll(async () => {
     await prisma.$disconnect();
   });
   ```

3. **Rodar testes sequencialmente**:
   ```json
   // jest.config.js
   {
     "maxWorkers": 1
   }
   ```

4. **Usar banco de testes isolado**:
   - Criar database separada para testes
   - Ou usar SQLite em memória para testes rápidos

---

### 3. Testes que Ainda Falham

Lista de testes que precisam de atenção:

```
FAIL test/create-anuncio-with-images.e2e-spec.ts
FAIL test/users.e2e-spec.ts
FAIL test/leads.e2e-spec.ts
FAIL test/auth.e2e-spec.ts
FAIL test/user-avatar.e2e-spec.ts
FAIL test/property-images.e2e-spec.ts
FAIL test/user-registration-flow.e2e-spec.ts
FAIL test/password-management.e2e-spec.ts
FAIL test/anuncio-images.e2e-spec.ts
FAIL src/application/use-cases/anuncio-images/upload-anuncio-image.use-case.spec.ts
FAIL src/application/use-cases/anuncio-images/list-anuncio-images.use-case.spec.ts
FAIL src/application/use-cases/anuncio-images/delete-anuncio.use-case.spec.ts
FAIL src/application/use-cases/anuncio-images/set-primary-image.use-case.spec.ts
FAIL src/application/use-cases/anuncio-images/delete-anuncio-image.use-case.spec.ts
```

---

## 📊 ESTATÍSTICAS

| Métrica | Status |
|---------|--------|
| Build | ✅ Passando |
| Testes Unitários | ~36/44 passando (~82%) |
| Testes E2E | ❌ Falhando (conexões) |

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

1. **Imediato**: Ajustar mocks dos testes de `anuncio-images` para usar tokens corretos
2. **Curto prazo**: Resolver problema de conexões dos testes E2E
3. **Médio prazo**: Adicionar mais testes de integração para coverage

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

### Novos Arquivos:
```
src/application/ports/
├── anuncio-repository.ts
├── finance-repository.ts
├── calendar-repository.ts
└── people-repository.ts

src/infrastructure/database/
├── prisma-anuncio.repository.ts
├── prisma-finance.repository.ts
├── prisma-calendar.repository.ts
└── prisma-people.repository.ts

src/interfaces/http/mappers/
└── booking.mapper.ts

src/application/use-cases/property-images/
└── validate-image-file.use-case.ts

src/finance/finance.tokens.ts
src/calendar/calendar.tokens.ts
src/people/people.tokens.ts
src/real-estate/real-estate.tokens.ts
```

### Arquivos Modificados:
- Todos os services (RealEstate, Finance, Calendar, People)
- Módulos correspondentes
- Controllers (bookings, owner-bookings, proprietario)
- Use cases de imagens (property e anuncio)
- 17+ arquivos de use cases para usar novo caminho de erros

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [x] Código compila sem erros
- [x] API funciona (testar no Swagger)
- [x] Repository Pattern aplicado em todos os domínios
- [x] Use cases usando injeção de dependência correta
- [x] Erros centralizados
- [ ] Testes passando (parcial)
- [ ] Coverage de testes adequado

---

**Documento criado em: 21/02/2026**
**Próxima ação: Continuar próxima refatoração ou resolver problemas de testes**
