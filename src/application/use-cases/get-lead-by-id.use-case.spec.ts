import { Lead, LeadStatus } from '../../domain/entities/lead';
import { CreateLeadData, LeadRepository } from '../ports/lead-repository';
import { GetLeadByIdUseCase } from './get-lead-by-id.use-case';
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
    throw new Error('Not implemented');
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

describe('GetLeadByIdUseCase', () => {
  it('should return lead by id', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new GetLeadByIdUseCase(repository);

    const created = await repository.create({
      nome: 'João Silva',
      email: 'joao@example.com',
      telefone: '11999999999',
      origem: 'Website',
      interesse: 'Casa'
    });

    const lead = await useCase.execute(created.id);

    expect(lead.id).toBe(created.id);
    expect(lead.nome).toBe('João Silva');
    expect(lead.email).toBe('joao@example.com');
  });

  it('should throw error if lead not found', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new GetLeadByIdUseCase(repository);

    await expect(useCase.execute('non-existent-id')).rejects.toBeInstanceOf(
      LeadNotFoundError
    );
  });
});
