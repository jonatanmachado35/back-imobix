import { Lead, LeadStatus } from '../../domain/entities/lead';
import { CreateLeadData, LeadRepository } from '../ports/lead-repository';
import { CreateLeadUseCase, CreateLeadInput } from './create-lead.use-case';
import { LeadAlreadyExistsError } from './lead-errors';

class InMemoryLeadRepository implements LeadRepository {
  private items: Lead[] = [];
  private counter = 1;

  async findById(id: string): Promise<Lead | null> {
    return this.items.find((item) => item.id === id) || null;
  }

  async findByEmail(email: string): Promise<Lead | null> {
    return this.items.find((item) => item.email === email) || null;
  }

  async findAll(): Promise<Lead[]> {
    return [...this.items];
  }

  async create(data: CreateLeadData): Promise<Lead> {
    const now = new Date();
    const lead = new Lead(
      String(this.counter++),
      data.nome,
      data.email,
      data.telefone || null,
      data.origem || null,
      data.interesse || null,
      LeadStatus.NOVO,
      now,
      now,
      data.anotacoes || null
    );
    this.items.push(lead);
    return lead;
  }

  async update(id: string, data: any): Promise<Lead> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Lead not found');
    
    const existing = this.items[index];
    const updated = new Lead(
      existing.id,
      data.nome || existing.nome,
      existing.email,
      data.telefone !== undefined ? data.telefone : existing.telefone,
      data.origem !== undefined ? data.origem : existing.origem,
      data.interesse !== undefined ? data.interesse : existing.interesse,
      existing.status,
      existing.dataContato,
      new Date(),
      data.anotacoes !== undefined ? data.anotacoes : existing.anotacoes
    );
    this.items[index] = updated;
    return updated;
  }

  async save(lead: Lead): Promise<Lead> {
    const index = this.items.findIndex((item) => item.id === lead.id);
    if (index !== -1) {
      this.items[index] = lead;
    } else {
      this.items.push(lead);
    }
    return lead;
  }
}

describe('CreateLeadUseCase', () => {
  it('should create a new lead', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new CreateLeadUseCase(repository);

    const input: CreateLeadInput = {
      nome: 'João Silva',
      email: 'joao@example.com',
      telefone: '11999999999',
      origem: 'Website',
      interesse: 'Apartamento na praia'
    };

    const lead = await useCase.execute(input);

    expect(lead.nome).toBe('João Silva');
    expect(lead.email).toBe('joao@example.com');
    expect(lead.status).toBe(LeadStatus.NOVO);
    expect(lead.telefone).toBe('11999999999');
  });

  it('should create lead with minimal data', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new CreateLeadUseCase(repository);

    const input: CreateLeadInput = {
      nome: 'Maria Santos',
      email: 'maria@example.com'
    };

    const lead = await useCase.execute(input);

    expect(lead.nome).toBe('Maria Santos');
    expect(lead.email).toBe('maria@example.com');
    expect(lead.telefone).toBeNull();
    expect(lead.origem).toBeNull();
  });

  it('should reject duplicate email', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new CreateLeadUseCase(repository);

    const input: CreateLeadInput = {
      nome: 'João Silva',
      email: 'joao@example.com'
    };

    await useCase.execute(input);

    await expect(
      useCase.execute({
        nome: 'João Silva 2',
        email: 'joao@example.com'
      })
    ).rejects.toBeInstanceOf(LeadAlreadyExistsError);
  });

  it('should validate lead data through entity', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new CreateLeadUseCase(repository);

    await expect(
      useCase.execute({
        nome: '',
        email: 'joao@example.com'
      })
    ).rejects.toThrow('Invalid lead data');
  });

  it('should reject invalid email', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new CreateLeadUseCase(repository);

    await expect(
      useCase.execute({
        nome: 'João Silva',
        email: 'invalid-email'
      })
    ).rejects.toThrow('Invalid lead data');
  });
});
