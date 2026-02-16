import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IFileStorageService } from '../../ports/file-storage.interface';

@Injectable()
export class DeletePropertyImageUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorageService: IFileStorageService,
  ) { }

  async execute(propertyId: string, imageId: string, ownerId: string): Promise<void> {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });

    if (!property) {
      throw new NotFoundException(`Property com ID ${propertyId} não encontrada`);
    }

    if (property.ownerId !== ownerId) {
      throw new ForbiddenException('You are not the owner of this property');
    }

    const image = await this.prisma.propertyImage.findFirst({
      where: {
        id: imageId,
        propertyId,
      },
    });

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

    await this.prisma.propertyImage.delete({
      where: { id: imageId },
    });

    if (wasPrimary) {
      const nextImage = await this.prisma.propertyImage.findFirst({
        where: { propertyId },
        orderBy: { displayOrder: 'asc' },
      });

      if (nextImage) {
        await this.prisma.propertyImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }
  }
}
