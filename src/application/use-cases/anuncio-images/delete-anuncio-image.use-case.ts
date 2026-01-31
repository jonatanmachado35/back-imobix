import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IFileStorageService } from '../../ports/file-storage.interface';

/**
 * Use Case: Deletar imagem de anúncio
 * 
 * Responsabilidades:
 * 1. Validar que a imagem existe
 * 2. Deletar do provedor de armazenamento (Cloudinary)
 * 3. Deletar do banco de dados
 * 4. Se era imagem primária, definir outra como primária automaticamente
 * 
 * Clean Architecture: Orquestra regras de negócio sem conhecer detalhes de infraestrutura
 */
@Injectable()
export class DeleteAnuncioImageUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(anuncioId: string, imageId: string): Promise<void> {
    // 1. Validar que a imagem existe e pertence ao anúncio
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

    const wasPrimary = image.isPrimary;

    try {
      // 2. Deletar do provedor de armazenamento
      await this.fileStorageService.delete(image.publicId);
    } catch (error) {
      // Log mas continue - se falhar no Cloudinary, ainda deletamos do DB
      console.error('Failed to delete from storage:', error);
    }

    // 3. Deletar do banco de dados
    await this.prisma.anuncioImage.delete({
      where: { id: imageId },
    });

    // 4. Se era primária, definir outra como primária
    if (wasPrimary) {
      const nextImage = await this.prisma.anuncioImage.findFirst({
        where: { anuncioId },
        orderBy: { displayOrder: 'asc' },
      });

      if (nextImage) {
        await this.prisma.anuncioImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }
  }
}
