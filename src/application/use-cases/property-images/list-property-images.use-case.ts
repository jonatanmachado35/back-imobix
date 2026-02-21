import { Inject, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PropertyRepository } from '../../ports/property-repository';
import { PROPERTY_REPOSITORY } from '../../../properties/properties.tokens';

@Injectable()
export class ListPropertyImagesUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY) private readonly propertyRepository: PropertyRepository
  ) { }

  async execute(propertyId: string, ownerId: string) {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw new NotFoundException(`Property com ID ${propertyId} não encontrada`);
    }

    if (property.ownerId !== ownerId) {
      throw new ForbiddenException('You are not the owner of this property');
    }

    return this.propertyRepository.findImagesByPropertyId(propertyId);
  }
}
