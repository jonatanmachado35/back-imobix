import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AnuncioRepository } from '../../ports/anuncio-repository';
import { ANUNCIO_REPOSITORY } from '../../../real-estate/real-estate.tokens';

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
  constructor(
    @Inject(ANUNCIO_REPOSITORY) private readonly anuncioRepository: AnuncioRepository,
  ) {}

  async execute(anuncioId: string) {
    // Validar que anúncio existe
    const anuncio = await this.anuncioRepository.findById(anuncioId);

    if (!anuncio) {
      throw new NotFoundException(`Anúncio com ID ${anuncioId} não encontrado`);
    }

    // Retornar imagens ordenadas (primária primeiro, depois por displayOrder)
    const images = await this.anuncioRepository.findImagesByAnuncioId(anuncioId);

    return images;
  }
}
