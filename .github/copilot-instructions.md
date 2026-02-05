# Imobix - AI Coding Instructions

## Project Overview
NestJS-based real estate management platform (Brazilian market - "aluguel de temporada") with Clean Architecture and TDD. Backend API for managing properties (anúncios), leads, corretores (real estate agents), reservations, and finances.

## Architecture Principles

### Clean Architecture Layers (Dependency Rule: Inner ← Outer)
```
domain/ → entities (Lead, User) - immutable, pure business logic, NO framework dependencies
application/ → use cases + ports (interfaces) - orchestration, framework-agnostic
infrastructure/ → adapters (PrismaLeadRepository, BcryptHasher) - implements ports
interfaces/ → controllers, DTOs - HTTP/external interfaces
```

**Critical**: Domain entities are immutable. State changes return new instances (see [src/domain/entities/lead.ts](src/domain/entities/lead.ts) `qualify()` method).

### Module Organization Pattern
Each feature module follows this structure (example: CRM module):
- **Module file**: `crm/crm.module.ts` - dependency injection setup with tokens
- **Tokens**: `crm/crm.tokens.ts` - symbols for DI (e.g., `LEAD_REPOSITORY`)
- **Service**: `crm/crm.service.ts` - legacy pattern, being phased out for use cases
- **Controller**: `interfaces/http/leads.controller.ts` - HTTP layer
- **Use cases**: `application/use-cases/create-lead.use-case.ts` - business logic

### Dependency Injection Pattern
Use **factory providers** with tokens for use cases (NOT `@Injectable()` constructor injection):

```typescript
// crm.module.ts
providers: [
  { provide: LEAD_REPOSITORY, useClass: PrismaLeadRepository },
  {
    provide: CreateLeadUseCase,
    useFactory: (repo: LeadRepository) => new CreateLeadUseCase(repo),
    inject: [LEAD_REPOSITORY]
  }
]
```

This keeps use cases framework-agnostic and testable.

## Code Conventions

### Naming (Portuguese Domain Terms)
- **Use Portuguese** for business domain terms: `nome` (not `name`), `corretor` (not `broker`), `anúncio` (not `listing`)
- **Use English** for technical terms: `repository`, `useCase`, `controller`
- Examples: [src/domain/entities/lead.ts](src/domain/entities/lead.ts), [prisma/schema.prisma](prisma/schema.prisma)

### Data Flow Pattern
1. Controller receives DTO → validates with `class-validator`
2. Maps DTO to use case input type
3. Use case executes business logic with domain entities
4. Returns domain entity (controller maps to response DTO if needed)

Example: [src/application/use-cases/create-lead.use-case.ts](src/application/use-cases/create-lead.use-case.ts)

### Repository Pattern
- Ports define interfaces: [src/application/ports/lead-repository.ts](src/application/ports/lead-repository.ts)
- Adapters implement with Prisma: [src/infrastructure/database/prisma-lead.repository.ts](src/infrastructure/database/prisma-lead.repository.ts)
- **Key method**: `save(lead: Lead)` - persists domain entity state changes
- `toDomain()` mapper converts Prisma model → domain entity

## Testing Strategy (TDD Mandatory)

### Test Pyramid: 70% unit / 25% integration / 5% E2E
- **Unit tests**: Use cases, domain entities (use in-memory repositories)
- **Integration tests**: Repositories with real database (migrations in `test:e2e`)
- **E2E tests**: Critical flows only (auth, lead import, image upload)

### Test-First Workflow
1. Write failing test first (Red)
2. Implement simplest solution (Green)
3. Refactor while keeping tests green

Reference: [TDD_GUIDE.md](TDD_GUIDE.md) for complete patterns and examples.

### Coverage Requirements
- **Threshold**: 70% minimum (configured in [jest.config.js](jest.config.js))
- **Target**: 100% for use cases and domain entities
- Run: `npm run test:cov`

## Development Workflows

### Database Changes
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npm run prisma:migrate:dev

# Production deploy
npm run prisma:migrate:deploy
```

### Running Tests
```bash
npm test                 # Unit tests
npm run test:cov         # With coverage report
npm run test:e2e         # E2E (runs migrations first)
```

### Local Development
```bash
docker-compose up        # Postgres + app with hot reload
npm run start:dev        # Or standalone (needs local Postgres)
```

Access Swagger docs: `http://localhost:3000/docs`

## Key Integration Points

### File Storage (Cloudinary)
- Upload service: [src/infrastructure/file-storage/cloudinary/cloudinary.service.ts](src/infrastructure/file-storage/cloudinary/cloudinary.service.ts)
- Use cases: [src/application/use-cases/anuncio-images/](src/application/use-cases/anuncio-images/)
- Handles image optimization, transformations, primary image selection

### CSV Import
- Use case: [src/application/use-cases/import-leads-from-csv.use-case.ts](src/application/use-cases/import-leads-from-csv.use-case.ts)
- Accepts alternative column names (PT/EN): see [CSV_IMPORT_GUIDE.md](CSV_IMPORT_GUIDE.md)
- Validation errors returned per row

### Authentication
- JWT strategy: [src/auth/strategies/jwt.strategy.ts](src/auth/strategies/jwt.strategy.ts)
- Guards: [src/auth/guards/jwt-auth.guard.ts](src/auth/guards/jwt-auth.guard.ts)
- Use `@UseGuards(JwtAuthGuard)` on protected routes

## Common Patterns

### Creating a New Feature
1. Define domain entity in `domain/entities/` with unit tests
2. Create repository port in `application/ports/`
3. Implement Prisma adapter in `infrastructure/database/`
4. Write use case with unit tests (use in-memory repo)
5. Create controller + DTOs in `interfaces/http/`
6. Wire up in module with factory providers
7. Add E2E test for critical path

### Error Handling
- Use domain-specific error classes (e.g., `LeadAlreadyExistsError`)
- Map to HTTP exceptions in controllers
- See [src/application/use-cases/lead-errors.ts](src/application/use-cases/lead-errors.ts)

### State Transitions
Domain entities handle their own state rules:
```typescript
// Lead.qualify() checks if status allows qualification
// Returns new Lead instance (immutable pattern)
const qualifiedLead = lead.qualify();
await repository.save(qualifiedLead);
```

## Anti-Patterns to Avoid
- ❌ Framework decorators in domain entities (`@Injectable()` in Lead class)
- ❌ Services that just proxy Prisma calls (use use cases instead)
- ❌ `any` types in DTOs (use proper types with `class-validator`)
- ❌ Testing implementation details (test behavior, not internals)
- ❌ Mixing English/Portuguese inconsistently in same context

## Current Tech Stack
- **Framework**: NestJS 10.4 + Express
- **Database**: PostgreSQL + Prisma 5.21
- **Auth**: Passport JWT + bcrypt
- **Files**: Cloudinary + Multer
- **Testing**: Jest 29 + Supertest
- **Validation**: class-validator + class-transformer
- **Docs**: Swagger (NestJS OpenAPI)

## Reference Documentation
- Complete guides: [README.md](README.md), [IMPROVEMENTS.md](IMPROVEMENTS.md)
- Backend spec: [BACKEND_CREATION_GUIDE.md](BACKEND_CREATION_GUIDE.md)
- Release notes: [release-v2.md](release-v2.md)
- Agent templates: [.github/agents/](/.github/agents/) (for specialized AI roles)
