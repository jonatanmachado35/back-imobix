import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  FileUploadDto,
  IFileStorageService,
} from '../../ports/file-storage.interface';

@Injectable()
export class UploadPropertyImageUseCase {
  private readonly MAX_IMAGES_PER_PROPERTY = 20;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorageService: IFileStorageService,
  ) { }

  async execute(
    propertyId: string,
    ownerId: string,
    file: FileUploadDto,
    isPrimary = false,
    displayOrder = 0,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { images: true },
    });

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
        await this.prisma.propertyImage.updateMany({
          where: { propertyId },
          data: { isPrimary: false },
        });
      }

      createdImage = await this.prisma.propertyImage.create({
        data: {
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
        },
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
