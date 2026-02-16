import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ListPropertyImagesUseCase {
  constructor(private readonly prisma: PrismaService) { }

  async execute(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property com ID ${propertyId} não encontrada`);
    }

    if (property.ownerId !== ownerId) {
      throw new ForbiddenException('You are not the owner of this property');
    }

    return this.prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
