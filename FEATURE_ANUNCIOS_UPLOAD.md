# Feature: Upload de Imagens para Anúncios

**Status**: Planejamento  
**Prioridade**: Alta  
**Estimativa**: Médio Porte  
**Cobertura de Testes Requerida**: ≥80% (total)

---

## 1. Visão Geral

### Objetivo
Permitir o upload, armazenamento e gestão de imagens associadas aos anúncios imobiliários através de integração com o Cloudinary como provedor de armazenamento externo.

### Contexto
Atualmente, o sistema de anúncios não possui capacidade de upload de imagens. Esta feature adiciona essa capacidade mantendo os princípios de Clean Architecture e separação de responsabilidades.

---

## 2. Princípios Arquiteturais

### 2.1 Separação de Concerns
- **Domain Layer**: Não conhece Cloudinary. Define contratos e regras de negócio
- **Application Layer**: Orquestra casos de uso sem conhecer detalhes de infraestrutura
- **Infrastructure Layer**: Implementa integração com Cloudinary
- **Interface Layer**: Controllers HTTP que recebem multipart/form-data

### 2.2 Dependency Rule
```
Interface → Application → Domain ← Infrastructure
```
Todas as dependências apontam para o Domain. Infrastructure implementa portas definidas no Application.

### 2.3 Technology as a Detail
Cloudinary é um detalhe de implementação. O sistema deve poder trocar de provedor (AWS S3, GCS, etc.) sem impacto no domínio ou casos de uso.

---

## 3. Decisões Arquiteturais

### 3.1 Opções Avaliadas

#### Opção A: Upload Direto no Controller
- ✅ **Prós**: Simples, rápido
- ❌ **Contras**: Acopla controller a Cloudinary, dificulta testes, viola Clean Architecture

#### Opção B: Service Layer com Cloudinary SDK Direto
- ✅ **Prós**: Mais organizado que Opção A
- ❌ **Contras**: Service ainda acoplado, dificulta substituição de provedor

#### **Opção C: Port/Adapter Pattern (RECOMENDADO)**
- ✅ **Prós**: Desacoplamento total, testabilidade, troca de provedor sem impacto
- ✅ **Permite mock fácil em testes**
- ✅ **Alinhado com Clean Architecture**
- ⚠️ **Contras**: Mais código inicial (justificado pelos benefícios)

**Decisão**: Seguir **Opção C** - Port/Adapter Pattern

---

## 4. Estrutura de Módulos e Camadas

### 4.1 Domain Layer
**Localização**: `src/domain/`

**Responsabilidades**:
- Definir entidade de imagem/mídia se necessário
- Regras de negócio sobre imagens (validações de domínio)
- Value Objects relacionados (ImageUrl, ImageMetadata)

**Não contém**: Lógica de upload, SDK de terceiros

### 4.2 Application Layer
**Localização**: `src/application/`

**Componentes**:
```
src/application/
  ports/
    IFileStorageService.ts      # Interface/Port
  use-cases/
    upload-anuncio-image.use-case.ts
    delete-anuncio-image.use-case.ts
    list-anuncio-images.use-case.ts
```

**Responsabilidades**:
- Definir `IFileStorageService` interface (port)
- Orquestrar casos de uso
- Validações de aplicação (tamanho, tipo de arquivo)
- Gerenciar transações (upload + persistência DB)

**Contrato da Interface**:
```typescript
interface IFileStorageService {
  upload(file: FileUploadDto): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
  getUrl(publicId: string, transformations?: object): string;
}
```

### 4.3 Infrastructure Layer
**Localização**: `src/infrastructure/file-storage/`

**Componentes**:
```
src/infrastructure/
  file-storage/
    cloudinary/
      cloudinary.service.ts      # Implementação do IFileStorageService
      cloudinary.config.ts       # Configuração
      cloudinary.module.ts
```

**Responsabilidades**:
- Implementar `IFileStorageService` usando Cloudinary SDK
- Gerenciar configuração e credenciais
- Tratamento de erros específicos do Cloudinary
- Transformações e otimizações de imagem

**Configuração**:
```typescript
// Usar variáveis de ambiente
CLOUDINARY_CLOUD_NAME=dtl5wdhnu
CLOUDINARY_API_KEY=398519331477366
CLOUDINARY_API_SECRET=02c76UvTJNyX-qPtms6IW_JmaII
```

⚠️ **CRÍTICO**: Credenciais NUNCA em código. Sempre via `.env` e validadas no startup.

### 4.4 Interface Layer (HTTP)
**Localização**: `src/real-estate/`

**Componentes**:
```
src/real-estate/
  anuncios.controller.ts         # Adicionar endpoints de upload
  dto/
    upload-image.dto.ts
    image-response.dto.ts
```

**Responsabilidades**:
- Receber multipart/form-data
- Validar DTO (Pipes do NestJS)
- Chamar use-cases
- Retornar responses padronizados

**Endpoints Sugeridos**:
```
POST   /anuncios/:id/images      # Upload
DELETE /anuncios/:id/images/:imageId
GET    /anuncios/:id/images      # Listar
```

---

## 5. Modelo de Dados

### 5.1 Schema Prisma
**Localização**: `prisma/schema.prisma`

**Adição Requerida**:
```prisma
model AnuncioImage {
  id            String   @id @default(uuid())
  anuncioId     String
  anuncio       Anuncio  @relation(fields: [anuncioId], references: [id], onDelete: Cascade)
  
  publicId      String   @unique  // Cloudinary public_id
  url           String              // URL da imagem
  secureUrl     String              // HTTPS URL
  format        String              // jpg, png, etc
  width         Int?
  height        Int?
  bytes         Int?
  
  displayOrder  Int      @default(0)  // Ordem de exibição
  isPrimary     Boolean  @default(false)  // Imagem principal
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([anuncioId])
  @@index([isPrimary])
}

// Adicionar relação em Anuncio
model Anuncio {
  // ... campos existentes
  images        AnuncioImage[]
}
```

**Migration**: Criar nova migration via `npx prisma migrate dev`

---

## 6. Regras de Negócio e Validações

### 6.1 Validações de Aplicação
- **Tipos permitidos**: image/jpeg, image/png, image/webp
- **Tamanho máximo**: 10MB por imagem
- **Quantidade máxima**: 20 imagens por anúncio
- **Uma e somente uma** imagem deve ser `isPrimary=true`

### 6.2 Validações de Domínio
- Anúncio deve existir antes de associar imagens
- Ao deletar anúncio, deletar imagens em cascata (DB + Cloudinary)
- Ao definir nova imagem primária, remover flag das outras

### 6.3 Transações e Consistência
**Cenário**: Upload de imagem
1. Upload para Cloudinary (pode falhar)
2. Se sucesso, salvar metadata no DB
3. Se falha no DB, fazer rollback no Cloudinary (deletar)

**Estratégia**: Use case deve orquestrar esse fluxo com try/catch adequado.

---

## 7. Segurança e Boas Práticas

### 7.1 Segurança
- ✅ Validar extensão E magic number do arquivo
- ✅ Sanitizar nomes de arquivo
- ✅ Implementar rate limiting nos endpoints de upload
- ✅ Credenciais via environment variables + validação no bootstrap
- ✅ Usar signed URLs quando aplicável
- ❌ NUNCA expor API secret no frontend

### 7.2 Performance
- Upload assíncrono quando possível
- Gerar thumbnails automáticos via Cloudinary transformations
- Considerar lazy loading nas listagens
- Cache de URLs transformadas

### 7.3 Observabilidade
- Log de uploads (sucesso/falha)
- Métricas de tamanho e quantidade
- Alertas de quota do Cloudinary

---

## 8. Estratégia de Testes

### 8.1 Cobertura Requerida
**Mínimo**: 80% de cobertura total (statements, branches, functions, lines)

**Comando de verificação**:
```bash
npm run test:cov
```

### 8.2 Tipos de Testes

#### Unit Tests
**Localização**: Arquivos `*.spec.ts` ao lado do código

**Focar em**:
- Use cases (mockando IFileStorageService)
- DTOs e validações
- Regras de negócio de imagem

**Exemplo de Mock**:
```typescript
const mockFileStorageService: IFileStorageService = {
  upload: jest.fn().mockResolvedValue({ 
    publicId: 'test-id', 
    url: 'https://cloudinary.com/test' 
  }),
  delete: jest.fn(),
  getUrl: jest.fn(),
};
```

#### Integration Tests
**Localização**: `test/*.e2e-spec.ts`

**Focar em**:
- Endpoints de upload completos
- Fluxo completo: upload → DB → response
- Validações de DTO
- Error handling

**Usar**:
- Test database
- Mock do Cloudinary service na infraestrutura

#### E2E Tests (Opcional mas Recomendado)
- Upload real em ambiente de teste Cloudinary
- Verificar cleanup adequado
- Performance de upload

### 8.3 Checklist de Testes

Antes de cada commit/PR:
- [ ] `npm test` passa sem erros
- [ ] `npm run test:cov` mostra ≥80% cobertura
- [ ] Testes de upload com sucesso
- [ ] Testes de upload com falha (arquivo inválido)
- [ ] Testes de deleção (DB + Cloudinary)
- [ ] Testes de validação (tamanho, tipo, quantidade)
- [ ] Testes de múltiplas imagens
- [ ] Testes de imagem primária

---

## 9. Fluxo de Desenvolvimento Recomendado

### Fase 1: Setup de Infraestrutura
1. Instalar dependência: `npm install cloudinary`
2. Configurar variáveis de ambiente
3. Criar `cloudinary.config.ts` e `cloudinary.module.ts`
4. Validar conexão no startup

### Fase 2: Definir Contratos (Domain/Application)
1. Criar `IFileStorageService` interface
2. Definir DTOs
3. Criar schema Prisma e migration
4. Escrever testes para contratos (TDD)

### Fase 3: Implementar Adapter
1. Implementar `CloudinaryService` que implementa `IFileStorageService`
2. Testes unitários do adapter (com mock do SDK)
3. Registrar provider no módulo

### Fase 4: Use Cases
1. Implementar `UploadAnuncioImageUseCase`
2. Implementar `DeleteAnuncioImageUseCase`
3. Implementar lógica de transação e rollback
4. Testes unitários (mockando IFileStorageService)

### Fase 5: Controllers e DTOs
1. Adicionar endpoints em `anuncios.controller.ts`
2. Configurar `@UseInterceptors(FileInterceptor())`
3. Validações de DTO com class-validator
4. Testes E2E completos

### Fase 6: Validação Final
1. Executar todos os testes
2. Verificar cobertura ≥80%
3. Testar manualmente via Postman/Insomnia
4. Code review focado em segurança

---

## 10. Dependências Externas

### NPM Packages
```json
{
  "cloudinary": "^1.41.0",
  "@nestjs/platform-express": "já instalado",
  "multer": "já incluso via platform-express"
}
```

### Tipos
```bash
npm install -D @types/multer
```

---

## 11. Considerações de Escalabilidade

### Curto Prazo
- Upload síncrono suficiente para MVP
- Cloudinary free tier: 25 GB de armazenamento, 25 GB de bandwidth

### Médio Prazo (se necessário)
- Implementar fila (Bull/BullMQ) para uploads assíncronos
- CDN do Cloudinary para otimização de entrega
- Múltiplas resoluções automáticas

### Longo Prazo (trade-offs)
- **Opção A**: Continuar com Cloudinary (managed, simples)
- **Opção B**: Migrar para S3 + CloudFront (mais controle, potencial custo menor em escala)
- **Decisão**: Adiar até atingir limites do free tier

---

## 12. Checklist de Implementação

### Antes de Começar
- [ ] Ler este documento completamente
- [ ] Entender Clean Architecture e Port/Adapter pattern
- [ ] Configurar ambiente local com credenciais

### Durante Desenvolvimento
- [ ] Seguir TDD quando possível
- [ ] Commitar pequeno e frequente
- [ ] Executar `npm test` antes de cada commit
- [ ] Manter cobertura ≥80%
- [ ] Não fazer commit de credenciais

### Antes de Finalizar
- [ ] Todos os testes passando
- [ ] Cobertura verificada e documentada
- [ ] Testado manualmente em ambiente local
- [ ] Documentação de API atualizada
- [ ] Migration aplicada e testada
- [ ] Rollback da migration testado
- [ ] Code review solicitado

---

## 13. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Exceder quota Cloudinary | Baixa | Alto | Monitorar uso, implementar alertas |
| Falha de upload deixar DB inconsistente | Média | Médio | Implementar transação com rollback |
| Arquivos maliciosos | Média | Alto | Validar magic number + extensão |
| Performance em múltiplos uploads | Baixa | Médio | Rate limiting + upload assíncrono futuro |

---

## 14. Critérios de Aceitação

### Funcionais
- ✅ Upload de imagens JPEG/PNG/WEBP até 10MB
- ✅ Máximo 20 imagens por anúncio
- ✅ Marcar uma imagem como primária
- ✅ Deletar imagem remove do Cloudinary e DB
- ✅ Listar todas as imagens de um anúncio

### Não-Funcionais
- ✅ Testes com cobertura ≥80%
- ✅ Tempo de upload <5s para arquivo de 5MB
- ✅ Endpoints protegidos com autenticação
- ✅ Credenciais nunca expostas
- ✅ Clean Architecture respeitada

### Técnicos
- ✅ Port/Adapter implementado corretamente
- ✅ Cloudinary é detalhe de infraestrutura
- ✅ Possível trocar provedor sem mudar use cases
- ✅ Migration aplicada sem quebrar dados existentes

---

## 15. Referências

- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

---

## 16. Notas Finais do Arquiteto

### Filosofia
> "A arquitetura deve facilitar mudanças, não impedi-las. Cloudinary hoje, S3 amanhã, outra coisa depois. O domínio permanece."

### Sobre Testes
A cobertura de 80% não é apenas um número. É garantia de que podemos refatorar com confiança e que mudanças não quebram comportamento existente.

### Sobre Complexidade
O Port/Adapter adiciona alguns arquivos a mais, mas paga dividendos em manutenibilidade. Time futuro agradece.

### Quando em Dúvida
1. Consulte este documento
2. Pergunte: "Esta mudança viola Clean Architecture?"
3. Escreva o teste primeiro
4. Refatore depois de verde

---

**Documento mantido por**: Arquiteto de Software  
**Última atualização**: 30 de janeiro de 2026  
**Versão**: 1.0
