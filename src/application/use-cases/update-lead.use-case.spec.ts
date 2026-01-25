import { Lead, LeadStatus } from '../../domain/entities/lead';
import { CreateLeadData, LeadRepository } from '../ports/lead-repository';
import { UpdateLeadUseCase } from './update-lead.use-case';
import { LeadNotFoundError } from './lead-errors';

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
      data.nome !== undefined ? data.nome : existing.nome,
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

describe('UpdateLeadUseCase', () => {
  it('should update lead data', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new UpdateLeadUseCase(repository);

    const lead = await repository.create({
      nome: 'João Silva',
      email: 'joao@example.com',
      telefone: null,
      origem: null,
      interesse: null
    });

    const updated = await useCase.execute(lead.id, {
      telefone: '11999999999',
      origem: 'Website'
    });

    expect(updated.telefone).toBe('11999999999');
    expect(updated.origem).toBe('Website');
    expect(updated.nome).toBe('João Silva'); // Unchanged
  });

  it('should throw error if lead not found', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new UpdateLeadUseCase(repository);

    await expect(
      useCase.execute('non-existent-id', { telefone: '11999999999' })
    ).rejects.toBeInstanceOf(LeadNotFoundError);
  });

  it('should update only provided fields', async () => {
    const repository = new InMemoryLeadRepository();
    const useCase = new UpdateLeadUseCase(repository);

    const lead = await repository.create({
      nome: 'João Silva',
      email: 'joao@example.com',
      telefone: '11999999999',
      origem: 'Facebook',
      interesse: 'Casa'
    });

    const updated = await useCase.execute(lead.id, {
      interesse: 'Apartamento'
    });

    expect(updated.interesse).toBe('Apartamento');
    expect(updated.telefone).toBe('11999999999'); // Unchanged
    expect(updated.origem).toBe('Facebook'); // Unchanged
  });
});
