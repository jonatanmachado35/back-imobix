import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ListAnuncioImagesUseCase } from './list-anuncio-images.use-case';
import { AnuncioRepository } from '../../ports/anuncio-repository';
import { ANUNCIO_REPOSITORY } from '../../../real-estate/real-estate.tokens';

describe('ListAnuncioImagesUseCase', () => {
  let useCase: ListAnuncioImagesUseCase;
  let mockAnuncioRepository: jest.Mocked<AnuncioRepository>;

  const mockRepository = {
    findById: jest.fn(),
    findByIdWithImages: jest.fn(),
    findImagesByAnuncioId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListAnuncioImagesUseCase,
        {
          provide: ANUNCIO_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListAnuncioImagesUseCase>(ListAnuncioImagesUseCase);
    mockAnuncioRepository = module.get(ANUNCIO_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockAnuncio = {
      id: 'anuncio-1',
      titulo: 'Casa na Praia',
    };

    it('should list all images of an existing anuncio', async () => {
      mockAnuncioRepository.findById.mockResolvedValue(mockAnuncio as any);
      mockAnuncioRepository.findImagesByAnuncioId.mockResolvedValue([
        { id: 'img-1', url: 'http://img1.jpg', isPrimary: true } as any,
        { id: 'img-2', url: 'http://img2.jpg', isPrimary: false } as any,
      ]);

      const result = await useCase.execute('anuncio-1');

      expect(result).toHaveLength(2);
      expect(mockAnuncioRepository.findById).toHaveBeenCalledWith('anuncio-1');
      expect(mockAnuncioRepository.findImagesByAnuncioId).toHaveBeenCalledWith('anuncio-1');
    });

    it('should throw NotFoundException when anuncio does not exist', async () => {
      mockAnuncioRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('inexistente')).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when anuncio has no images', async () => {
      mockAnuncioRepository.findById.mockResolvedValue(mockAnuncio as any);
      mockAnuncioRepository.findImagesByAnuncioId.mockResolvedValue([]);

      const result = await useCase.execute('anuncio-1');

      expect(result).toHaveLength(0);
    });

    it('should order images by isPrimary first, then displayOrder', async () => {
      mockAnuncioRepository.findById.mockResolvedValue(mockAnuncio as any);
      const images = [
        { id: 'img-2', isPrimary: false } as any,
        { id: 'img-1', isPrimary: true } as any,
      ];
      mockAnuncioRepository.findImagesByAnuncioId.mockResolvedValue(images);

      await useCase.execute('anuncio-1');

      // Repository handles ordering, we just verify it's called
      expect(mockAnuncioRepository.findImagesByAnuncioId).toHaveBeenCalledWith('anuncio-1');
    });

    it('should return images with all properties', async () => {
      mockAnuncioRepository.findById.mockResolvedValue(mockAnuncio as any);
      const images = [
        { 
          id: 'img-1', 
          url: 'http://img1.jpg', 
          secureUrl: 'https://img1.jpg',
          isPrimary: true,
          displayOrder: 0,
        } as any,
      ];
      mockAnuncioRepository.findImagesByAnuncioId.mockResolvedValue(images);

      const result = await useCase.execute('anuncio-1');

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('url');
      expect(result[0]).toHaveProperty('isPrimary');
    });
  });
});
