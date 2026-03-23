# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
seguindo [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.2.0] - 2026-03-23
### Added
- Campos `ownerName`, `ownerPhone`, `ownerWhatsApp` na entidade Property
- Endpoint `GET /properties/:id` agora retorna dados do proprietário
- Testes unitários para os novos campos de owner (4 novos testes)
- Docs iniciais: `architecture.md`, `business-rules.md`, `api-contracts.md`

### Changed
- `PropertyProps` interface: adicionados campos opcionais de owner
- `Property.toJSON()`: inclui `ownerName`, `ownerPhone`, `ownerWhatsApp`
- `PrismaPropertyRepository.findById()`: query inclui `owner: true`
- `PrismaPropertyRepository.findAll()`: query agora inclui `owner: true` (BUG-01 FIX)
- `PrismaPropertyRepository.findByOwner()`: query agora inclui `owner: true` (BUG-01 FIX)
- `PrismaPropertyRepository.toDomain()`: mapeia campos do owner (nome, phone)

### Fixed
- **BUG-01:** `findAll()` e `findByOwner()` não retornavam owner fields
  - Endpoints afetados: GET /properties, GET /properties/featured, GET /properties/seasonal, GET /proprietario/properties
  - Root cause: Faltava `include: { owner: true }` na query Prisma
  - Impacto: ownerName, ownerPhone, ownerWhatsApp agora corretos em todas listagens
  - Testes: 26/26 passando (property.spec.ts + create-property.use-case.spec.ts)

### Technical Note
- `ownerWhatsApp` usa o campo `phone` do User (não existe campo `whatsapp` separado no schema)
- Conformidade: ADR-003, BR-005, api-contracts.md validados ✅

## [0.1.0] - 2025-01-01
### Added
- Setup inicial do projeto NestJS + Clean Architecture
- Entidade Property com type, status, category
- CRUD de imóveis via Prisma
- Upload de imagens via Cloudinary
- Sistema de reservas (bookings)
- Chat entre cliente e proprietário
