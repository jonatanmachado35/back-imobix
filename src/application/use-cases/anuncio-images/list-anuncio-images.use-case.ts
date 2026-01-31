import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

/**
 * Use Case: Listar todas as imagens de um anúncio
 * 
 * Responsabilidades:
 * 1. Validar que o anúncio existe
 * 2. Retornar todas as imagens ordenadas
 * 
 * Clean Architecture: Orquestra regras de negócio
 */
@Injectable()
export class ListAnuncioImagesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(anuncioId: string) {
    // Validar que anúncio existe
    const anuncio = await this.prisma.anuncio.findUnique({
      where: { id: anuncioId },
    });

    if (!anuncio) {
      throw new NotFoundException(`Anúncio com ID ${anuncioId} não encontrado`);
    }

    // Retornar imagens ordenadas (primária primeiro, depois por displayOrder)
    const images = await this.prisma.anuncioImage.findMany({
      where: { anuncioId },
      orderBy: [
        { isPrimary: 'desc' }, // Primária vem primeiro
        { displayOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return images;
  }
}
