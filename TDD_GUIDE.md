# TDD Best Practices - Imobix

## 🎯 Filosofia TDD

Test-Driven Development não é sobre escrever testes - é sobre **design** e **confiança**.

## 📋 Regras Fundamentais

### 1. Red → Green → Refactor

```
❌ RED:    Escreva um teste que falha
✅ GREEN:  Faça o teste passar (solução simples)
♻️ REFACTOR: Melhore o código mantendo testes verdes
```

### 2. Teste Primeiro, Sempre

```typescript
// ❌ ERRADO: Código sem teste
export class CreateLeadUseCase {
  async execute(input) {
    // implementação...
  }
}

// ✅ CORRETO: Teste antes
describe('CreateLeadUseCase', () => {
  it('should create a lead', async () => {
    // test...
  });
});

// Depois implementar
export class CreateLeadUseCase {
  async execute(input: CreateLeadInput): Promise<Lead> {
    // implementação...
  }
}
```

## 🏗️ Estrutura de Testes

### Anatomia de um Bom Teste

```typescript
describe('CreateLeadUseCase', () => {
  // ✅ Nome descritivo do comportamento
  it('should reject duplicate email', async () => {
    // ARRANGE: Preparar cenário
    const repository = new InMemoryLeadRepository();
    const useCase = new CreateLeadUseCase(repository);
    await repository.create({ email: 'john@example.com', ... });

    // ACT: Executar ação
    const promise = useCase.execute({ email: 'john@example.com', ... });

    // ASSERT: Verificar resultado
    await expect(promise).rejects.toBeInstanceOf(EmailAlreadyExistsError);
  });
});
```

### ✅ Boas Práticas

```typescript
// ✅ Um conceito por teste
it('should reject empty name', () => {
  expect(() => new Lead('', 'email@test.com')).toThrow();
});

it('should reject invalid email', () => {
  expect(() => new Lead('João', 'invalid-email')).toThrow();
});

// ❌ Múltiplos conceitos em um teste
it('should validate lead data', () => {
  expect(() => new Lead('', 'email@test.com')).toThrow();
  expect(() => new Lead('João', 'invalid')).toThrow();
  expect(() => new Lead('João', 'valid@test.com')).not.toThrow();
});
```

## 🎭 Tipos de Testes

### 1. Testes de Entidade (Domain)

```typescript
// src/domain/entities/lead.spec.ts
describe('Lead Entity', () => {
  it('should create valid lead', () => {
    const lead = new Lead('1', 'João', 'joao@test.com', ...);
    expect(lead.nome).toBe('João');
  });

  it('should reject invalid email', () => {
    expect(() => 
      new Lead('1', 'João', 'invalid', ...)
    ).toThrow(InvalidLeadDataError);
  });
});
```

**Características:**
- ✅ Sem dependências externas
- ✅ Testa lógica de negócio pura
- ✅ Rápidos (< 10ms)
- ✅ Sem mocks

### 2. Testes de Use Case (Application)

```typescript
// src/application/use-cases/create-lead.use-case.spec.ts
class InMemoryLeadRepository implements LeadRepository {
  // Implementação fake simples
}

describe('CreateLeadUseCase', () => {
  it('should create a lead', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new CreateLeadUseCase(repository);
    
    const lead = await useCase.execute({
      nome: 'João',
      email: 'joao@test.com'
    });
    
    expect(lead.email).toBe('joao@test.com');
  });
});
```

**Características:**
- ✅ Usa InMemory repositories (não mocks!)
- ✅ Testa comportamento do caso de uso
- ✅ Sem NestJS TestingModule
- ✅ Rápidos (< 50ms)

### 3. Testes E2E (Interface)

```typescript
// test/leads.e2e-spec.ts
describe('Leads (e2e)', () => {
  it('POST /leads should create lead', async () => {
    const response = await request(app.getHttpServer())
      .post('/leads')
      .send({ nome: 'João', email: 'joao@test.com' })
      .expect(201);

    expect(response.body.email).toBe('joao@test.com');
  });
});
```

**Características:**
- ✅ Testa o sistema completo
- ✅ Usa banco de dados real (test)
- ✅ Mais lentos (> 100ms)
- ✅ Menor quantidade

## 🚫 Anti-Patterns

### ❌ Testar Implementação

```typescript
// ❌ ERRADO: Testa COMO faz
it('should call repository.create', async () => {
  const spy = jest.spyOn(repository, 'create');
  await useCase.execute(input);
  expect(spy).toHaveBeenCalled();
});

// ✅ CORRETO: Testa O QUE faz
it('should create a lead', async () => {
  const lead = await useCase.execute(input);
  expect(lead.email).toBe(input.email);
});
```

### ❌ Mocks Excessivos

```typescript
// ❌ ERRADO: Mock complexo
const mockRepository = {
  create: jest.fn().mockResolvedValue(mockLead),
  findByEmail: jest.fn().mockResolvedValue(null)
};

// ✅ CORRETO: Implementação fake simples
class InMemoryLeadRepository implements LeadRepository {
  private items: Lead[] = [];
  
  async create(data: CreateLeadData): Promise<Lead> {
    const lead = new Lead(/* ... */);
    this.items.push(lead);
    return lead;
  }
  
  async findByEmail(email: string): Promise<Lead | null> {
    return this.items.find(l => l.email === email) || null;
  }
}
```

### ❌ Testes que Quebram com Refactoring

```typescript
// ❌ ERRADO: Acoplado à estrutura
it('should have email property', () => {
  expect(lead.email).toBeDefined();
});

// ✅ CORRETO: Testa comportamento
it('should return lead with provided email', () => {
  const lead = createLead({ email: 'test@test.com' });
  expect(lead.email).toBe('test@test.com');
});
```

## 📊 Pirâmide de Testes

```
     /\
    /  \    E2E (10%)
   /____\
  /      \  Integration (20%)
 /________\
/__________\ Unit Tests (70%)
```

**Distribuição Ideal:**
- 70% Unit Tests (Entities + Use Cases)
- 20% Integration Tests (Repositories + Database)
- 10% E2E Tests (Controllers + HTTP)

## 🎯 O Que Testar

### ✅ SEMPRE Teste

- Lógica de negócio (entities)
- Casos de uso (use cases)
- Validações
- Transições de estado
- Regras de negócio
- Tratamento de erros

### ❌ NÃO Teste

- Framework behavior (NestJS, Prisma)
- Getters/setters triviais
- Constantes
- Código de terceiros
- Configurações

## 🏃 Workflow TDD

### Exemplo Prático: Criar "Qualify Lead"

#### 1. Red - Escreva o teste

```typescript
// qualify-lead.use-case.spec.ts
describe('QualifyLeadUseCase', () => {
  it('should qualify a lead', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new QualifyLeadUseCase(repository);
    
    const lead = await repository.create({
      nome: 'João',
      email: 'joao@test.com',
      status: LeadStatus.NOVO
    });
    
    const qualified = await useCase.execute(lead.id);
    
    expect(qualified.status).toBe(LeadStatus.QUALIFICADO);
  });
});
```

**Resultado:** ❌ Test fails - QualifyLeadUseCase não existe

#### 2. Green - Faça passar (simples)

```typescript
// qualify-lead.use-case.ts
export class QualifyLeadUseCase {
  constructor(private repository: LeadRepository) {}
  
  async execute(leadId: string): Promise<Lead> {
    const lead = await this.repository.findById(leadId);
    const qualified = lead.qualify();
    return this.repository.save(qualified);
  }
}
```

**Resultado:** ✅ Test passes

#### 3. Refactor - Melhore

```typescript
// Adicionar validações, error handling, etc.
export class QualifyLeadUseCase {
  constructor(private repository: LeadRepository) {}
  
  async execute(leadId: string): Promise<Lead> {
    const lead = await this.repository.findById(leadId);
    
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }
    
    const qualified = lead.qualify();
    return this.repository.save(qualified);
  }
}
```

**Resultado:** ✅ Tests still pass + better code

## 📏 Code Coverage

```bash
# Rodar com cobertura
npm run test:cov

# Ver relatório
open coverage/lcov-report/index.html
```

### Metas de Cobertura

```javascript
// jest.config.js
coverageThresholds: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

**Lembre-se:** 100% de cobertura ≠ código perfeito
- Foque em **qualidade** dos testes
- Coverage é uma métrica, não o objetivo

## 🎓 Checklist TDD

Antes de commitar:

- [ ] Todos os testes passam (`npm test`)
- [ ] Coverage está acima do threshold (`npm run test:cov`)
- [ ] Testes descrevem comportamento, não implementação
- [ ] Sem mocks desnecessários
- [ ] Um conceito por teste
- [ ] Testes rápidos (< 100ms para unit tests)
- [ ] Nomes descritivos e claros

## 🔗 Recursos

- [Kent Beck - Test Driven Development](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Martin Fowler - TDD](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Lembre-se:** TDD não é sobre testar - é sobre **design orientado por testes**.
