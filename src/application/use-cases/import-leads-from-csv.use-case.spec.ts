import { ImportLeadsFromCsvUseCase } from './import-leads-from-csv.use-case';
import { LeadRepository } from '../ports/lead-repository';
import { Lead, LeadStatus } from '../../domain/entities/lead';
import { LeadAlreadyExistsError } from '../../domain/entities/lead-errors';

describe('ImportLeadsFromCsvUseCase', () => {
  let useCase: ImportLeadsFromCsvUseCase;
  let leadRepository: jest.Mocked<LeadRepository>;

  beforeEach(() => {
    leadRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    };
    useCase = new ImportLeadsFromCsvUseCase(leadRepository);
  });

  it('should import valid leads from CSV', async () => {
    const csvContent = `nome,email,telefone,origem,interesse
John Doe,john@example.com,123456789,Website,Property A
Jane Smith,jane@example.com,987654321,Referral,Property B`;
    
    const buffer = Buffer.from(csvContent);
    
    leadRepository.findByEmail.mockResolvedValue(null);
    leadRepository.save.mockImplementation((lead) => Promise.resolve(lead));

    const result = await useCase.execute(buffer);

    expect(result.totalProcessed).toBe(2);
    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(leadRepository.save).toHaveBeenCalledTimes(2);
  });

  it('should handle duplicate emails and continue processing', async () => {
    const csvContent = `nome,email,telefone
John Doe,john@example.com,123456789
Jane Smith,existing@example.com,987654321
Bob Wilson,bob@example.com,555555555`;
    
    const buffer = Buffer.from(csvContent);
    
    const existingLead = new Lead(
      '1',
      'Existing User',
      'existing@example.com',
      null,
      null,
      null,
      LeadStatus.NOVO,
      new Date(),
      new Date()
    );

    leadRepository.findByEmail.mockImplementation((email) => {
      if (email === 'existing@example.com') {
        return Promise.resolve(existingLead);
      }
      return Promise.resolve(null);
    });
    
    leadRepository.save.mockImplementation((lead) => Promise.resolve(lead));

    const result = await useCase.execute(buffer);

    expect(result.totalProcessed).toBe(3);
    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(3);
    expect(result.errors[0].data.email).toBe('existing@example.com');
    expect(result.errors[0].error).toContain('já cadastrado');
  });

  it('should handle missing required fields', async () => {
    const csvContent = `nome,email,telefone
,invalid@example.com,123456789
Jane Smith,,987654321`;
    
    const buffer = Buffer.from(csvContent);
    
    leadRepository.findByEmail.mockResolvedValue(null);
    leadRepository.save.mockImplementation((lead) => Promise.resolve(lead));

    const result = await useCase.execute(buffer);

    expect(result.totalProcessed).toBe(2);
    expect(result.successCount).toBe(0);
    expect(result.errorCount).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].error).toContain('Nome é obrigatório');
    expect(result.errors[1].error).toContain('Email é obrigatório');
  });

  it('should handle CSV with semicolon delimiter', async () => {
    const csvContent = `nome;email;telefone
John Doe;john@example.com;123456789`;
    
    const buffer = Buffer.from(csvContent);
    
    leadRepository.findByEmail.mockResolvedValue(null);
    leadRepository.save.mockImplementation((lead) => Promise.resolve(lead));

    const result = await useCase.execute(buffer);

    expect(result.totalProcessed).toBe(1);
    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(0);
  });

  it('should accept alternative column names', async () => {
    const csvContent = `name,email,phone,source,interest
John Doe,john@example.com,123456789,Website,Property`;
    
    const buffer = Buffer.from(csvContent);
    
    leadRepository.findByEmail.mockResolvedValue(null);
    leadRepository.save.mockImplementation((lead) => Promise.resolve(lead));

    const result = await useCase.execute(buffer);

    expect(result.totalProcessed).toBe(1);
    expect(result.successCount).toBe(1);
    expect(leadRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'John Doe',
        email: 'john@example.com',
        telefone: '123456789',
        origem: 'Website',
        interesse: 'Property'
      })
    );
  });
});
