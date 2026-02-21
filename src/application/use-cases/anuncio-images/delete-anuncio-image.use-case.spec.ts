import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteAnuncioImageUseCase } from './delete-anuncio-image.use-case';
import { AnuncioRepository } from '../../ports/anuncio-repository';
import { IFileStorageService } from '../../ports/file-storage.interface';
import { ANUNCIO_REPOSITORY } from '../../../real-estate/real-estate.tokens';

describe('DeleteAnuncioImageUseCase', () => {
  let useCase: DeleteAnuncioImageUseCase;
  let mockAnuncioRepository: jest.Mocked<AnuncioRepository>;
  let mockFileStorageService: jest.Mocked<IFileStorageService>;

  const mockRepository = {
    findImageById: jest.fn(),
    findImagesByAnuncioId: jest.fn(),
    deleteImage: jest.fn(),
    setImagePrimary: jest.fn(),
  };

  const mockFileStorage = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAnuncioImageUseCase,
        {
          provide: ANUNCIO_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: IFileStorageService,
          useValue: mockFileStorage,
        },
      ],
    }).compile();

    useCase = module.get<DeleteAnuncioImageUseCase>(DeleteAnuncioImageUseCase);
    mockAnuncioRepository = module.get(ANUNCIO_REPOSITORY);
    mockFileStorageService = module.get(IFileStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockImage = {
      id: 'image-1',
      anuncioId: 'anuncio-1',
      publicId: 'anuncios/img-1',
      isPrimary: false,
    };

    it('should delete image from storage and database', async () => {
      mockAnuncioRepository.findImageById.mockResolvedValue(mockImage as any);
      mockFileStorage.delete.mockResolvedValue(undefined);
      mockAnuncioRepository.deleteImage.mockResolvedValue(undefined);

      await useCase.execute('anuncio-1', 'image-1');

      expect(mockFileStorage.delete).toHaveBeenCalledWith('anuncios/img-1');
      expect(mockAnuncioRepository.deleteImage).toHaveBeenCalledWith('image-1');
    });

    it('should throw NotFoundException when image does not exist', async () => {
      mockAnuncioRepository.findImageById.mockResolvedValue(null);

      await expect(useCase.execute('anuncio-1', 'inexistente')).rejects.toThrow(NotFoundException);
    });

    it('should continue even if storage deletion fails', async () => {
      mockAnuncioRepository.findImageById.mockResolvedValue(mockImage as any);
      mockFileStorage.delete.mockRejectedValue(new Error('Storage error'));
      mockAnuncioRepository.deleteImage.mockResolvedValue(undefined);

      // Should not throw
      await useCase.execute('anuncio-1', 'image-1');

      expect(mockAnuncioRepository.deleteImage).toHaveBeenCalledWith('image-1');
    });

    it('should set new primary if deleted image was primary', async () => {
      const primaryImage = { ...mockImage, isPrimary: true };
      mockAnuncioRepository.findImageById.mockResolvedValue(primaryImage as any);
      mockFileStorage.delete.mockResolvedValue(undefined);
      mockAnuncioRepository.deleteImage.mockResolvedValue(undefined);
      mockAnuncioRepository.findImagesByAnuncioId.mockResolvedValue([
        { id: 'image-2', isPrimary: false } as any,
      ]);
      mockAnuncioRepository.setImagePrimary.mockResolvedValue(undefined as any);

      await useCase.execute('anuncio-1', 'image-1');

      expect(mockAnuncioRepository.setImagePrimary).toHaveBeenCalledWith('image-2');
    });
  });
});
