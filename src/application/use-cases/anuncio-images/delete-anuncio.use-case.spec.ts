import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteAnuncioUseCase } from './delete-anuncio.use-case';
import { AnuncioRepository } from '../../ports/anuncio-repository';
import { IFileStorageService } from '../../ports/file-storage.interface';
import { ANUNCIO_REPOSITORY } from '../../../real-estate/real-estate.tokens';

describe('DeleteAnuncioUseCase', () => {
  let useCase: DeleteAnuncioUseCase;
  let mockAnuncioRepository: jest.Mocked<AnuncioRepository>;
  let mockFileStorageService: jest.Mocked<IFileStorageService>;

  const mockRepository = {
    findById: jest.fn(),
    findByIdWithImages: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    findImagesByAnuncioId: jest.fn(),
    findImageById: jest.fn(),
    createImage: jest.fn(),
    deleteImage: jest.fn(),
    clearImagePrimary: jest.fn(),
    setImagePrimary: jest.fn(),
  };

  const mockFileStorage = {
    delete: jest.fn(),
    upload: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAnuncioUseCase,
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

    useCase = module.get<DeleteAnuncioUseCase>(DeleteAnuncioUseCase);
    mockAnuncioRepository = module.get(ANUNCIO_REPOSITORY);
    mockFileStorageService = module.get(IFileStorageService);
  });

  describe('execute', () => {
    it('should delete anuncio and all its images from Cloudinary', async () => {
      const anuncioId = 'anuncio-123';
      const userId = 'user-123';
      const mockAnuncio = {
        id: anuncioId,
        titulo: 'Casa na Praia',
        criadoPorId: userId,
        images: [
          { id: 'img-1', publicId: 'anuncios/foto1', url: 'https://cloudinary.com/foto1.jpg' },
          { id: 'img-2', publicId: 'anuncios/foto2', url: 'https://cloudinary.com/foto2.jpg' },
          { id: 'img-3', publicId: 'anuncios/foto3', url: 'https://cloudinary.com/foto3.jpg' },
        ],
      };

      mockAnuncioRepository.findByIdWithImages.mockResolvedValue(mockAnuncio as any);
      mockAnuncioRepository.delete.mockResolvedValue(undefined as any);
      mockFileStorage.delete.mockResolvedValue(undefined);

      await useCase.execute(anuncioId, userId, 'USER');

      expect(mockFileStorage.delete).toHaveBeenCalledTimes(3);
      expect(mockAnuncioRepository.delete).toHaveBeenCalledWith(anuncioId);
    });

    it('should throw NotFoundException when anuncio does not exist', async () => {
      mockAnuncioRepository.findByIdWithImages.mockResolvedValue(null);

      await expect(
        useCase.execute('inexistente', 'user-123', 'USER'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner or admin', async () => {
      const mockAnuncio = {
        id: 'anuncio-123',
        criadoPorId: 'other-user',
        images: [],
      };
      mockAnuncioRepository.findByIdWithImages.mockResolvedValue(mockAnuncio as any);

      await expect(
        useCase.execute('anuncio-123', 'user-123', 'USER'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to delete any anuncio', async () => {
      const mockAnuncio = {
        id: 'anuncio-123',
        criadoPorId: 'other-user',
        images: [],
      };
      mockAnuncioRepository.findByIdWithImages.mockResolvedValue(mockAnuncio as any);
      mockAnuncioRepository.delete.mockResolvedValue(undefined as any);
      mockFileStorage.delete.mockResolvedValue(undefined);

      await useCase.execute('anuncio-123', 'admin-user', 'ADMIN');

      expect(mockAnuncioRepository.delete).toHaveBeenCalledWith('anuncio-123');
    });
  });
});
