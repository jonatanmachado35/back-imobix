import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

/**
 * Use Case: Definir imagem primária de um anúncio
 * 
 * Responsabilidades:
 * 1. Validar que a imagem existe e pertence ao anúncio
 * 2. Remover flag isPrimary de todas as outras imagens
 * 3. Definir a nova imagem como primária
 * 
 * Regra de negócio: Uma e somente uma imagem deve ser isPrimary=true
 */
@Injectable()
export class SetPrimaryImageUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(anuncioId: string, imageId: string) {
    // Validar que a imagem existe e pertence ao anúncio
    const image = await this.prisma.anuncioImage.findFirst({
      where: {
        id: imageId,
        anuncioId,
      },
    });

    if (!image) {
      throw new NotFoundException(
        `Imagem com ID ${imageId} não encontrada no anúncio ${anuncioId}`,
      );
    }

    // Se já é primária, retornar sem fazer nada
    if (image.isPrimary) {
      return image;
    }

    // Transação: remover flag de todas e definir nova primária
    const [, updatedImage] = await this.prisma.$transaction([
      // Remover isPrimary de todas as imagens do anúncio
      this.prisma.anuncioImage.updateMany({
        where: { anuncioId },
        data: { isPrimary: false },
      }),
      // Definir a nova imagem como primária
      this.prisma.anuncioImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    return updatedImage;
  }
}
