import { Lead } from '../../domain/entities/lead';
import { LeadRepository, UpdateLeadData } from '../ports/lead-repository';
import { LeadNotFoundError } from '../../domain/entities/lead-errors';

export type UpdateLeadInput = {
  nome?: string;
  telefone?: string;
  origem?: string;
  interesse?: string;
  anotacoes?: string;
};

export class UpdateLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(leadId: string, input: UpdateLeadInput): Promise<Lead> {
    const existingLead = await this.leadRepository.findById(leadId);

    if (!existingLead) {
      throw new LeadNotFoundError(leadId);
    }

    const updateData: UpdateLeadData = {
      nome: input.nome,
      telefone: input.telefone !== undefined ? input.telefone : undefined,
      origem: input.origem !== undefined ? input.origem : undefined,
      interesse: input.interesse !== undefined ? input.interesse : undefined,
      anotacoes: input.anotacoes !== undefined ? input.anotacoes : undefined
    };

    return this.leadRepository.update(leadId, updateData);
  }
}
