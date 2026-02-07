import { Property } from '../../../domain/entities/property';
import { PropertyRepository } from '../../ports/property-repository';

export class PropertyNotFoundError extends Error {
  constructor(propertyId: string) {
    super(`Property not found: ${propertyId}`);
    this.name = 'PropertyNotFoundError';
  }
}

export class GetPropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) { }

  async execute(propertyId: string): Promise<Property> {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw new PropertyNotFoundError(propertyId);
    }

    return property;
  }
}
