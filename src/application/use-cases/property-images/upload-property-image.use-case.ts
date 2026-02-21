import { Inject, Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  FileUploadDto,
  IFileStorageService,
} from '../../ports/file-storage.interface';
import { PropertyRepository } from '../../ports/property-repository';
import { PROPERTY_REPOSITORY } from '../../../properties/properties.tokens';

@Injectable()
export class UploadPropertyImageUseCase {
  private readonly MAX_IMAGES_PER_PROPERTY = 20;

  constructor(
    @Inject(PROPERTY_REPOSITORY) private readonly propertyRepository: PropertyRepository,
    private readonly fileStorageService: IFileStorageService,
  ) { }

  async execute(
    propertyId: string,
    ownerId: string,
    file: FileUploadDto,
    isPrimary = false,
    displayOrder = 0,
  ) {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw new NotFoundException(`Property com ID ${propertyId} não encontrada`);
    }

    if (property.ownerId !== ownerId) {
      throw new ForbiddenException('You are not the owner of this property');
    }

    if (property.images.length >= this.MAX_IMAGES_PER_PROPERTY) {
      throw new BadRequestException(
        `Property already has maximum of ${this.MAX_IMAGES_PER_PROPERTY} images`,
      );
    }

    let uploadResult;
    let createdImage;

    try {
      uploadResult = await this.fileStorageService.upload(file, 'properties');

      if (isPrimary) {
        await this.propertyRepository.clearImagePrimary(propertyId);
      }

      createdImage = await this.propertyRepository.createImage({
        propertyId,
        publicId: uploadResult.publicId,
        url: uploadResult.url,
        secureUrl: uploadResult.secureUrl,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
        displayOrder,
        isPrimary,
      });

      return createdImage;
    } catch (error) {
      if (uploadResult && !createdImage) {
        try {
          await this.fileStorageService.delete(uploadResult.publicId);
        } catch {
          // noop
        }
      }

      throw error;
    }
  }
}
