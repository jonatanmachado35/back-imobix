import { Lead, LeadStatus } from '../../domain/entities/lead';
import { CreateLeadData, LeadRepository } from '../ports/lead-repository';
import { ListLeadsUseCase } from './list-leads.use-case';

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

describe('ListLeadsUseCase', () => {
  it('should return all leads', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new ListLeadsUseCase(repository);

    await repository.create({
      nome: 'João Silva',
      email: 'joao@example.com',
      telefone: null,
      origem: null,
      interesse: null
    });

    await repository.create({
      nome: 'Maria Santos',
      email: 'maria@example.com',
      telefone: null,
      origem: null,
      interesse: null
    });

    const leads = await useCase.execute();

    expect(leads).toHaveLength(2);
    expect(leads[0].nome).toBe('João Silva');
    expect(leads[1].nome).toBe('Maria Santos');
  });

  it('should return empty array when no leads exist', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new ListLeadsUseCase(repository);

    const leads = await useCase.execute();

    expect(leads).toHaveLength(0);
  });
});
