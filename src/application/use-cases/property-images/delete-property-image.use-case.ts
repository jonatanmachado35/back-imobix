import { Inject, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PropertyRepository } from '../../ports/property-repository';
import { IFileStorageService } from '../../ports/file-storage.interface';
import { PROPERTY_REPOSITORY } from '../../../properties/properties.tokens';

@Injectable()
export class DeletePropertyImageUseCase {
  constructor(
    @Inject(PROPERTY_REPOSITORY) private readonly propertyRepository: PropertyRepository,
    private readonly fileStorageService: IFileStorageService,
  ) { }

  async execute(propertyId: string, imageId: string, ownerId: string): Promise<void> {
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

    const wasPrimary = image.isPrimary;

    try {
      await this.fileStorageService.delete(image.publicId);
    } catch {
      // noop
    }

    await this.propertyRepository.deleteImage(imageId);

    if (wasPrimary) {
      const images = await this.propertyRepository.findImagesByPropertyId(propertyId);
      if (images.length > 0) {
        await this.propertyRepository.setImagePrimary(images[0].id);
      }
    }
  }
}
