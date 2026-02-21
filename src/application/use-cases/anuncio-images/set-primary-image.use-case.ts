import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AnuncioRepository } from '../../ports/anuncio-repository';
import { ANUNCIO_REPOSITORY } from '../../../real-estate/real-estate.tokens';

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
  constructor(
    @Inject(ANUNCIO_REPOSITORY) private readonly anuncioRepository: AnuncioRepository,
  ) {}

  async execute(anuncioId: string, imageId: string) {
    // Validar que a imagem existe e pertence ao anúncio
    const image = await this.anuncioRepository.findImageById(imageId, anuncioId);

    if (!image) {
      throw new NotFoundException(
        `Imagem com ID ${imageId} não encontrada no anúncio ${anuncioId}`,
      );
    }

    // Se já é primária, retornar sem fazer nada
    if (image.isPrimary) {
      return image;
    }

    // Remover flag de todas e definir nova primária
    await this.anuncioRepository.clearImagePrimary(anuncioId);
    const updatedImage = await this.anuncioRepository.setImagePrimary(imageId);

    return updatedImage;
  }
}
