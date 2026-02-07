import { Property } from '../../../domain/entities/property';
import { PropertyRepository, UpdatePropertyData } from '../../ports/property-repository';

export class PropertyNotFoundError extends Error {
  constructor(propertyId: string) {
    super(`Property not found: ${propertyId}`);
    this.name = 'PropertyNotFoundError';
  }
}

export class NotPropertyOwnerError extends Error {
  constructor() {
    super('You are not the owner of this property');
    this.name = 'NotPropertyOwnerError';
  }
}

export interface UpdatePropertyInput {
  propertyId: string;
  ownerId: string; // For authorization
  data: UpdatePropertyData;
}

export class UpdatePropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) { }

  async execute(input: UpdatePropertyInput): Promise<Property> {
    const property = await this.propertyRepository.findById(input.propertyId);

    if (!property) {
      throw new PropertyNotFoundError(input.propertyId);
    }

    if (property.ownerId !== input.ownerId) {
      throw new NotPropertyOwnerError();
    }

    return this.propertyRepository.update(input.propertyId, input.data);
  }
}
