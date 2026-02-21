import { Inject, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PropertyRepository } from '../../ports/property-repository';
import { PROPERTY_REPOSITORY } from '../../../properties/properties.tokens';

@Injectable()
export class SetPrimaryPropertyImageUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY) private readonly propertyRepository: PropertyRepository
  ) { }

  async execute(propertyId: string, imageId: string, ownerId: string) {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw new NotFoundException(`Property com ID ${propertyId} não encontrada`);
    }

    if (property.ownerId !== ownerId) {
      throw new ForbiddenException('You are not the owner of this property');
    }

    const image = await this.propertyRepository.findImageById(imageId, propertyId);

    if (!image) {
      throw new NotFoundException(
        `Imagem com ID ${imageId} não encontrada na property ${propertyId}`,
      );
    }

    if (image.isPrimary) {
      return image;
    }

    await this.propertyRepository.clearImagePrimary(propertyId);
    const updatedImage = await this.propertyRepository.setImagePrimary(imageId);

    return updatedImage;
  }
}
