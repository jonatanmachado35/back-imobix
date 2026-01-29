import { Readable } from 'stream';
import { parse } from 'csv-parse';
import { Lead, LeadStatus, InvalidLeadDataError } from '../../domain/entities/lead';
import { LeadRepository } from '../ports/lead-repository';
import { LeadAlreadyExistsError } from './lead-errors';

export type ImportedLeadData = {
  nome: string;
  email: string;
  telefone?: string;
  origem?: string;
  interesse?: string;
};

export type ImportError = {
  row: number;
  data: Partial<ImportedLeadData>;
  error: string;
};

export type ImportLeadsResult = {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
};

export class ImportLeadsFromCsvUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(csvBuffer: Buffer): Promise<ImportLeadsResult> {
    const records = await this.parseCsv(csvBuffer);
    
    const result: ImportLeadsResult = {
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // +2 porque linha 1 é header e array começa em 0
      const record = records[i];
      
      result.totalProcessed++;

      try {
        await this.processRecord(record);
        result.successCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          data: record,
          error: this.getErrorMessage(error)
        });
      }
    }

    return result;
  }

  private async parseCsv(buffer: Buffer): Promise<ImportedLeadData[]> {
    return new Promise((resolve, reject) => {
      const records: ImportedLeadData[] = [];
      const stream = Readable.from(buffer);

      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: [',', ';'], // Aceita vírgula ou ponto-e-vírgula
        relax_column_count: true
      });

      stream
        .pipe(parser)
        .on('data', (record) => {
          records.push({
            nome: record.nome || record.name || '',
            email: record.email || '',
            telefone: record.telefone || record.phone || record.telephone || null,
            origem: record.origem || record.source || record.origin || null,
            interesse: record.interesse || record.interest || null
          });
        })
        .on('error', (error) => {
          reject(new Error(`Erro ao processar CSV: ${error.message}`));
        })
        .on('end', () => {
          resolve(records);
        });
    });
  }

  private async processRecord(data: ImportedLeadData): Promise<void> {
    // Validar dados obrigatórios
    if (!data.nome || data.nome.trim().length === 0) {
      throw new Error('Nome é obrigatório');
    }

    if (!data.email || data.email.trim().length === 0) {
      throw new Error('Email é obrigatório');
    }

    // Verificar se email já existe
    const existingLead = await this.leadRepository.findByEmail(data.email);
    if (existingLead) {
      throw new LeadAlreadyExistsError(data.email);
    }

    // Criar lead
    const lead = new Lead(
      '', // ID será gerado pelo repositório
      data.nome.trim(),
      data.email.trim().toLowerCase(),
      data.telefone?.trim() || null,
      data.origem?.trim() || null,
      data.interesse?.trim() || null,
      LeadStatus.NOVO,
      new Date(),
      new Date(),
      null
    );

    await this.leadRepository.save(lead);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof LeadAlreadyExistsError) {
      return 'Email já cadastrado no sistema';
    }
    
    if (error instanceof InvalidLeadDataError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Erro desconhecido ao processar registro';
  }
}
