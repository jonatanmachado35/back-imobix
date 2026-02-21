import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UploadAnuncioImageUseCase } from './upload-anuncio-image.use-case';
import { AnuncioRepository } from '../../ports/anuncio-repository';
import { IFileStorageService } from '../../ports/file-storage.interface';
import { ANUNCIO_REPOSITORY } from '../../../real-estate/real-estate.tokens';

describe('UploadAnuncioImageUseCase', () => {
  let useCase: UploadAnuncioImageUseCase;
  let anuncioRepository: jest.Mocked<AnuncioRepository>;
  let fileStorageService: jest.Mocked<IFileStorageService>;

  const mockAnuncioRepository = {
    findAll: jest.fn(),
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

  const mockFileStorageService = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadAnuncioImageUseCase,
        {
          provide: ANUNCIO_REPOSITORY,
          useValue: mockAnuncioRepository,
        },
        {
          provide: IFileStorageService,
          useValue: mockFileStorageService,
        },
      ],
    }).compile();

    useCase = module.get<UploadAnuncioImageUseCase>(UploadAnuncioImageUseCase);
    anuncioRepository = module.get(ANUNCIO_REPOSITORY);
    fileStorageService = module.get(IFileStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockFile = {
      buffer: Buffer.from('test'),
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
    };

    const mockAnuncio = {
      id: 'anuncio-1',
      titulo: 'Casa na Praia',
      images: [],
    };

    it('should upload an image to an existing anuncio', async () => {
      anuncioRepository.findByIdWithImages.mockResolvedValue(mockAnuncio as any);
      
      fileStorageService.upload.mockResolvedValue({
        publicId: 'anuncios/test-1',
        url: 'http://cdn/test-1.jpg',
        secureUrl: 'https://cdn/test-1.jpg',
        format: 'jpg',
        width: 1200,
        height: 800,
        bytes: 1024,
      });

      const mockImage = {
        id: 'img-1',
        anuncioId: 'anuncio-1',
        publicId: 'anuncios/test-1',
        url: 'http://cdn/test-1.jpg',
        secureUrl: 'https://cdn/test-1.jpg',
        format: 'jpg',
      };
      anuncioRepository.createImage.mockResolvedValue(mockImage as any);

      const result = await useCase.execute('anuncio-1', mockFile);

      expect(result.anuncioId).toBe('anuncio-1');
      expect(fileStorageService.upload).toHaveBeenCalled();
    });

    it('should throw NotFoundException when anuncio does not exist', async () => {
      anuncioRepository.findByIdWithImages.mockResolvedValue(null);

      await expect(
        useCase.execute('anuncio-inexistente', mockFile),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when max images reached', async () => {
      const anuncioWithMaxImages = {
        ...mockAnuncio,
        images: Array(20).fill({ id: 'img' }),
      };
      anuncioRepository.findByIdWithImages.mockResolvedValue(anuncioWithMaxImages as any);

      await expect(
        useCase.execute('anuncio-1', mockFile),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should clear previous primary when setting new primary', async () => {
      const anuncioWithImage = {
        ...mockAnuncio,
        images: [{ id: 'img-old', isPrimary: true }],
      };
      anuncioRepository.findByIdWithImages.mockResolvedValue(anuncioWithImage as any);
      
      fileStorageService.upload.mockResolvedValue({
        publicId: 'anuncios/test-1',
        url: 'http://cdn/test-1.jpg',
        secureUrl: 'https://cdn/test-1.jpg',
        format: 'jpg',
        width: 1200,
        height: 800,
        bytes: 1024,
      });

      const mockImage = {
        id: 'img-1',
        isPrimary: true,
      };
      anuncioRepository.createImage.mockResolvedValue(mockImage as any);

      await useCase.execute('anuncio-1', mockFile, true);

      expect(anuncioRepository.clearImagePrimary).toHaveBeenCalledWith('anuncio-1');
    });
  });
});
