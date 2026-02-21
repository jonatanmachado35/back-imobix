import { Lead, LeadStatus } from '../../domain/entities/lead';
import { CreateLeadData, LeadRepository } from '../ports/lead-repository';
import { LeadAlreadyExistsError } from '../../domain/entities/lead-errors';

export type CreateLeadInput = {
  nome: string;
  email: string;
  telefone?: string;
  origem?: string;
  interesse?: string;
  anotacoes?: string;
};

export class CreateLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(input: CreateLeadInput): Promise<Lead> {
    const existingLead = await this.leadRepository.findByEmail(input.email);
    
    if (existingLead) {
      throw new LeadAlreadyExistsError(input.email);
    }

    const data: CreateLeadData = {
      nome: input.nome,
      email: input.email,
      telefone: input.telefone || null,
      origem: input.origem || null,
      interesse: input.interesse || null,
      anotacoes: input.anotacoes || null
    };

    return this.leadRepository.create(data);
  }
}
