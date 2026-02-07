import { Property } from '../../../domain/entities/property';
import { PropertyRepository } from '../../ports/property-repository';

export class ListOwnerPropertiesUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) { }

  async execute(ownerId: string): Promise<Property[]> {
    return this.propertyRepository.findByOwner(ownerId);
  }
}
