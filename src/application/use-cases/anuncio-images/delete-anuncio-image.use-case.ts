import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AnuncioRepository } from '../../ports/anuncio-repository';
import { IFileStorageService } from '../../ports/file-storage.interface';
import { ANUNCIO_REPOSITORY } from '../../../real-estate/real-estate.tokens';

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
    @Inject(ANUNCIO_REPOSITORY) private readonly anuncioRepository: AnuncioRepository,
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(anuncioId: string, imageId: string): Promise<void> {
    // 1. Validar que a imagem existe e pertence ao anúncio
    const image = await this.anuncioRepository.findImageById(imageId, anuncioId);

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
    await this.anuncioRepository.deleteImage(imageId);

    // 4. Se era primária, definir outra como primária
    if (wasPrimary) {
      const images = await this.anuncioRepository.findImagesByAnuncioId(anuncioId);
      
      if (images.length > 0) {
        await this.anuncioRepository.setImagePrimary(images[0].id);
      }
    }
  }
}
