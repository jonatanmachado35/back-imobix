import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SetPrimaryImageUseCase } from './set-primary-image.use-case';
import { AnuncioRepository } from '../../ports/anuncio-repository';
import { ANUNCIO_REPOSITORY } from '../../../real-estate/real-estate.tokens';

describe('SetPrimaryImageUseCase', () => {
  let useCase: SetPrimaryImageUseCase;
  let mockAnuncioRepository: jest.Mocked<AnuncioRepository>;

  const mockRepository = {
    findImageById: jest.fn(),
    findImagesByAnuncioId: jest.fn(),
    clearImagePrimary: jest.fn(),
    setImagePrimary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetPrimaryImageUseCase,
        {
          provide: ANUNCIO_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<SetPrimaryImageUseCase>(SetPrimaryImageUseCase);
    mockAnuncioRepository = module.get(ANUNCIO_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockImage = {
      id: 'image-1',
      anuncioId: 'anuncio-1',
      isPrimary: false,
    };

    it('should set image as primary', async () => {
      mockAnuncioRepository.findImageById.mockResolvedValue(mockImage as any);
      mockAnuncioRepository.setImagePrimary.mockResolvedValue(undefined as any);

      const result = await useCase.execute('anuncio-1', 'image-1');

      expect(mockAnuncioRepository.findImageById).toHaveBeenCalledWith('image-1', 'anuncio-1');
      expect(mockAnuncioRepository.clearImagePrimary).toHaveBeenCalledWith('anuncio-1');
      expect(mockAnuncioRepository.setImagePrimary).toHaveBeenCalledWith('image-1');
    });

    it('should throw NotFoundException when image does not exist', async () => {
      mockAnuncioRepository.findImageById.mockResolvedValue(null);

      await expect(useCase.execute('anuncio-1', 'inexistente')).rejects.toThrow(NotFoundException);
    });

    it('should return same image if already primary', async () => {
      const primaryImage = { ...mockImage, isPrimary: true };
      mockAnuncioRepository.findImageById.mockResolvedValue(primaryImage as any);

      const result = await useCase.execute('anuncio-1', 'image-1');

      expect(result).toEqual(primaryImage);
      expect(mockAnuncioRepository.clearImagePrimary).not.toHaveBeenCalled();
      expect(mockAnuncioRepository.setImagePrimary).not.toHaveBeenCalled();
    });

    it('should clear other primaries before setting new primary', async () => {
      mockAnuncioRepository.findImageById.mockResolvedValue(mockImage as any);
      mockAnuncioRepository.setImagePrimary.mockResolvedValue(undefined as any);

      await useCase.execute('anuncio-1', 'image-1');

      expect(mockAnuncioRepository.clearImagePrimary).toHaveBeenCalledWith('anuncio-1');
      expect(mockAnuncioRepository.setImagePrimary).toHaveBeenCalledWith('image-1');
    });
  });
});
