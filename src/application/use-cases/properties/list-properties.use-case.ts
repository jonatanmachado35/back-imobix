import { Property } from '../../../domain/entities/property';
import { PropertyRepository, PropertyFilters } from '../../ports/property-repository';

export class ListPropertiesUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) { }

  async execute(filters?: PropertyFilters): Promise<Property[]> {
    return this.propertyRepository.findAll(filters);
  }
}
