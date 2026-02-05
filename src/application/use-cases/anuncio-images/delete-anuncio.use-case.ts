import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IFileStorageService } from '../../ports/file-storage.interface';

@Injectable()
export class DeleteAnuncioUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorage: IFileStorageService,
  ) { }

  async execute(anuncioId: string, userId: string, userRole: string): Promise<void> {
    // 1. Buscar anúncio com suas imagens
    const anuncio = await this.prisma.anuncio.findUnique({
      where: { id: anuncioId },
      include: { images: true },
    });

    if (!anuncio) {
      throw new NotFoundException('Anúncio não encontrado');
    }

    // 2. Validar autorização (dono ou admin)
    const isOwner = anuncio.criadoPorId === userId;
    const isAdmin = userRole === 'ADMIN';
    const hasNoOwner = !anuncio.criadoPorId; // Anúncios legados sem dono

    if (!isOwner && !isAdmin && !hasNoOwner) {
      throw new ForbiddenException('Você não tem permissão para deletar este anúncio');
    }

    // 3. Deletar imagens do Cloudinary (paralelo, mesmo se falhar continua)
    if (anuncio.images && anuncio.images.length > 0) {
      const deletePromises = anuncio.images.map((image) =>
        this.fileStorage.delete(image.publicId),
      );
      await Promise.allSettled(deletePromises); // Não falha se imagem não existe
    }

    // 4. Deletar anúncio do banco (cascade deleta AnuncioImages)
    await this.prisma.anuncio.delete({
      where: { id: anuncioId },
    });
  }
}
