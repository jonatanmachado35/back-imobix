import { Property, PropertyStatus } from '../../../domain/entities/property';
import { PropertyRepository } from '../../ports/property-repository';

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

export type StatusAction = 'activate' | 'pause' | 'remove';

export interface UpdatePropertyStatusInput {
  propertyId: string;
  ownerId: string;
  action: StatusAction;
}

export class UpdatePropertyStatusUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) { }

  async execute(input: UpdatePropertyStatusInput): Promise<Property> {
    const property = await this.propertyRepository.findById(input.propertyId);

    if (!property) {
      throw new PropertyNotFoundError(input.propertyId);
    }

    if (property.ownerId !== input.ownerId) {
      throw new NotPropertyOwnerError();
    }

    let updatedProperty: Property;

    switch (input.action) {
      case 'activate':
        updatedProperty = property.activate();
        break;
      case 'pause':
        updatedProperty = property.pause();
        break;
      case 'remove':
        updatedProperty = property.remove();
        break;
      default:
        throw new Error(`Invalid action: ${input.action}`);
    }

    return this.propertyRepository.updateStatus(input.propertyId, updatedProperty.status);
  }
}
