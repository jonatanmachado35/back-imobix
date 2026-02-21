import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AnuncioRepository } from '../../ports/anuncio-repository';
import { IFileStorageService } from '../../ports/file-storage.interface';
import { ANUNCIO_REPOSITORY } from '../../../real-estate/real-estate.tokens';

@Injectable()
export class DeleteAnuncioUseCase {
  constructor(
    @Inject(ANUNCIO_REPOSITORY) private readonly anuncioRepository: AnuncioRepository,
    private readonly fileStorage: IFileStorageService,
  ) { }

  async execute(anuncioId: string, userId: string, userRole: string): Promise<void> {
    // 1. Buscar anúncio com suas imagens
    const anuncio = await this.anuncioRepository.findByIdWithImages(anuncioId);

    if (!anuncio) {
      throw new NotFoundException('Anúncio não encontrado');
    }

    // 2. Validar autorização (dono ou admin)
    const isOwner = (anuncio as any).criadoPorId === userId;
    const isAdmin = userRole === 'ADMIN';
    const hasNoOwner = !(anuncio as any).criadoPorId; // Anúncios legados sem dono

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
    await this.anuncioRepository.delete(anuncioId);
  }
}
