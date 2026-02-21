import { Lead, LeadStatus } from '../../domain/entities/lead';
import { CreateLeadData, LeadRepository } from '../ports/lead-repository';
import { ConvertLeadUseCase } from './convert-lead.use-case';
import { LeadNotFoundError } from '../../domain/entities/lead-errors';

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

describe('ConvertLeadUseCase', () => {
  it('should convert a qualified lead', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new ConvertLeadUseCase(repository);

    const lead = await repository.create({
      nome: 'João Silva',
      email: 'joao@example.com',
      telefone: null,
      origem: null,
      interesse: null
    });

    // Qualify first
    const qualified = lead.qualify();
    await repository.save(qualified);

    const converted = await useCase.execute(qualified.id);

    expect(converted.status).toBe(LeadStatus.CONVERTIDO);
    expect(converted.id).toBe(lead.id);
  });

  it('should throw error if lead not found', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new ConvertLeadUseCase(repository);

    await expect(useCase.execute('non-existent-id')).rejects.toBeInstanceOf(
      LeadNotFoundError
    );
  });

  it('should throw error if lead not qualified', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new ConvertLeadUseCase(repository);

    const lead = await repository.create({
      nome: 'João Silva',
      email: 'joao@example.com',
      telefone: null,
      origem: null,
      interesse: null
    });

    await expect(useCase.execute(lead.id)).rejects.toThrow(
      'Lead must be qualified before conversion'
    );
  });
});
