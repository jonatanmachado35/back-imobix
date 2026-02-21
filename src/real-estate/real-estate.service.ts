import { Inject, Injectable } from '@nestjs/common';
import { AnuncioRepository } from '../application/ports/anuncio-repository';
import { ANUNCIO_REPOSITORY } from './real-estate.tokens';

@Injectable()
export class RealEstateService {
  constructor(
    @Inject(ANUNCIO_REPOSITORY) private readonly anuncioRepository: AnuncioRepository,
  ) {}

  async findAll() {
    return this.anuncioRepository.findAll({ includeImages: true });
  }

  async findOne(id: string) {
    return this.anuncioRepository.findByIdWithImages(id);
  }

  async create(data: any) {
    return this.anuncioRepository.create(data);
  }

  async update(id: string, data: any) {
    return this.anuncioRepository.update(id, data);
  }

  async updateStatus(id: string, status: any) {
    return this.anuncioRepository.updateStatus(id, status);
  }
}
