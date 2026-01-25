import { Lead } from '../../domain/entities/lead';
import { LeadRepository } from '../ports/lead-repository';

export class ListLeadsUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(): Promise<Lead[]> {
    return this.leadRepository.findAll();
  }
}
