import { LostLeadUseCase } from './lost-lead.use-case';
import { LeadRepository } from '../ports/lead-repository';
import { Lead, LeadStatus } from '../../domain/entities/lead';
import { LeadNotFoundError } from './lead-errors';

describe('LostLeadUseCase', () => {
  let useCase: LostLeadUseCase;
  let leadRepository: jest.Mocked<LeadRepository>;

  beforeEach(() => {
    leadRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    useCase = new LostLeadUseCase(leadRepository);
  });

  it('should mark lead as lost', async () => {
    const lead = new Lead(
      '1',
      'John Doe',
      'john@example.com',
      '123456789',
      'Website',
      'Property A',
      LeadStatus.CONTATADO,
      new Date(),
      new Date()
    );

    const lostLead = new Lead(
      '1',
      'John Doe',
      'john@example.com',
      '123456789',
      'Website',
      'Property A',
      LeadStatus.PERDIDO,
      lead.dataContato,
      new Date()
    );

    leadRepository.findById.mockResolvedValue(lead);
    leadRepository.save.mockResolvedValue(lostLead);

    const result = await useCase.execute('1');

    expect(result.status).toBe(LeadStatus.PERDIDO);
    expect(leadRepository.findById).toHaveBeenCalledWith('1');
    expect(leadRepository.save).toHaveBeenCalled();
  });

  it('should throw LeadNotFoundError when lead does not exist', async () => {
    leadRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('999')).rejects.toThrow(LeadNotFoundError);
  });
});
