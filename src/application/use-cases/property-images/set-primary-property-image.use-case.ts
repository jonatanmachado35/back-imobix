import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class SetPrimaryPropertyImageUseCase {
  constructor(private readonly prisma: PrismaService) { }

  async execute(propertyId: string, imageId: string, ownerId: string) {
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

    if (image.isPrimary) {
      return image;
    }

    const [, updatedImage] = await this.prisma.$transaction([
      this.prisma.propertyImage.updateMany({
        where: { propertyId },
        data: { isPrimary: false },
      }),
      this.prisma.propertyImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    return updatedImage;
  }
}
