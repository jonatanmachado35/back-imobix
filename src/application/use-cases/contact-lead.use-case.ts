import { Lead } from '../../domain/entities/lead';
import { LeadRepository } from '../ports/lead-repository';
import { LeadNotFoundError } from '../../domain/entities/lead-errors';

export class ContactLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(leadId: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId);
    
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }

    const contactedLead = lead.markAsContacted();
    
    return this.leadRepository.save(contactedLead);
  }
}
