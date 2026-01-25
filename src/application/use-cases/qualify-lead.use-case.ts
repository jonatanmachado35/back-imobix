import { Lead } from '../../domain/entities/lead';
import { LeadRepository } from '../ports/lead-repository';
import { LeadNotFoundError } from './lead-errors';

export class QualifyLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(leadId: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId);
    
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }

    const qualifiedLead = lead.qualify();
    
    return this.leadRepository.save(qualifiedLead);
  }
}
