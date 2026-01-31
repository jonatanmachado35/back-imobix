import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteAnuncioImageUseCase } from './delete-anuncio-image.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IFileStorageService } from '../../ports/file-storage.interface';

describe('DeleteAnuncioImageUseCase', () => {
  let useCase: DeleteAnuncioImageUseCase;
  let prismaService: any;
  let fileStorageService: jest.Mocked<IFileStorageService>;

  const mockPrismaService = {
    anuncioImage: {
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockFileStorageService = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAnuncioImageUseCase,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: IFileStorageService,
          useValue: mockFileStorageService,
        },
      ],
    }).compile();

    useCase = module.get<DeleteAnuncioImageUseCase>(DeleteAnuncioImageUseCase);
    prismaService = module.get(PrismaService);
    fileStorageService = module.get(IFileStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockImage = {
      id: 'image-1',
      anuncioId: 'anuncio-1',
      publicId: 'anuncios/test123',
      isPrimary: false,
    };

    it('should delete image successfully', async () => {
      prismaService.anuncioImage.findFirst.mockResolvedValue(mockImage as any);
      fileStorageService.delete.mockResolvedValue(undefined);
      prismaService.anuncioImage.delete.mockResolvedValue(mockImage as any);

      await useCase.execute('anuncio-1', 'image-1');

      expect(prismaService.anuncioImage.findFirst).toHaveBeenCalledWith({
        where: { id: 'image-1', anuncioId: 'anuncio-1' },
      });
      expect(fileStorageService.delete).toHaveBeenCalledWith('anuncios/test123');
      expect(prismaService.anuncioImage.delete).toHaveBeenCalledWith({
        where: { id: 'image-1' },
      });
    });

    it('should throw NotFoundException if image not found', async () => {
      prismaService.anuncioImage.findFirst.mockResolvedValue(null);

      await expect(useCase.execute('anuncio-1', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(fileStorageService.delete).not.toHaveBeenCalled();
      expect(prismaService.anuncioImage.delete).not.toHaveBeenCalled();
    });

    it('should set another image as primary if deleted was primary', async () => {
      const primaryImage = { ...mockImage, isPrimary: true };
      const nextImage = { id: 'image-2', anuncioId: 'anuncio-1', isPrimary: false };

      prismaService.anuncioImage.findFirst
        .mockResolvedValueOnce(primaryImage as any)
        .mockResolvedValueOnce(nextImage as any);
      fileStorageService.delete.mockResolvedValue(undefined);
      prismaService.anuncioImage.delete.mockResolvedValue(primaryImage as any);
      prismaService.anuncioImage.update.mockResolvedValue({
        ...nextImage,
        isPrimary: true,
      } as any);

      await useCase.execute('anuncio-1', 'image-1');

      expect(prismaService.anuncioImage.update).toHaveBeenCalledWith({
        where: { id: 'image-2' },
        data: { isPrimary: true },
      });
    });

    it('should continue even if storage delete fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      prismaService.anuncioImage.findFirst.mockResolvedValue(mockImage as any);
      fileStorageService.delete.mockRejectedValue(new Error('Storage error'));
      prismaService.anuncioImage.delete.mockResolvedValue(mockImage as any);

      await expect(useCase.execute('anuncio-1', 'image-1')).resolves.not.toThrow();

      expect(prismaService.anuncioImage.delete).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should not set new primary if deleted was not primary', async () => {
      prismaService.anuncioImage.findFirst.mockResolvedValue(mockImage as any);
      fileStorageService.delete.mockResolvedValue(undefined);
      prismaService.anuncioImage.delete.mockResolvedValue(mockImage as any);

      await useCase.execute('anuncio-1', 'image-1');

      // findFirst should only be called once (for the image to delete)
      expect(prismaService.anuncioImage.findFirst).toHaveBeenCalledTimes(1);
      expect(prismaService.anuncioImage.update).not.toHaveBeenCalled();
    });
  });
});
