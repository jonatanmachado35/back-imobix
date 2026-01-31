import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UploadAnuncioImageUseCase } from './upload-anuncio-image.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IFileStorageService } from '../../ports/file-storage.interface';

describe('UploadAnuncioImageUseCase', () => {
  let useCase: UploadAnuncioImageUseCase;
  let prismaService: any;
  let fileStorageService: jest.Mocked<IFileStorageService>;

  const mockPrismaService = {
    anuncio: {
      findUnique: jest.fn(),
    },
    anuncioImage: {
      create: jest.fn(),
      updateMany: jest.fn(),
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
        UploadAnuncioImageUseCase,
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

    useCase = module.get<UploadAnuncioImageUseCase>(UploadAnuncioImageUseCase);
    prismaService = module.get(PrismaService);
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
      titulo: 'Test Anuncio',
      images: [],
    };

    const mockUploadResult = {
      publicId: 'anuncios/test123',
      url: 'http://cloudinary.com/test.jpg',
      secureUrl: 'https://cloudinary.com/test.jpg',
      format: 'jpg',
      width: 800,
      height: 600,
      bytes: 1024,
    };

    const mockCreatedImage = {
      id: 'image-1',
      anuncioId: 'anuncio-1',
      ...mockUploadResult,
      displayOrder: 0,
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should upload image successfully', async () => {
      prismaService.anuncio.findUnique.mockResolvedValue(mockAnuncio as any);
      fileStorageService.upload.mockResolvedValue(mockUploadResult);
      prismaService.anuncioImage.create.mockResolvedValue(mockCreatedImage as any);

      const result = await useCase.execute('anuncio-1', mockFile);

      expect(result).toEqual(mockCreatedImage);
      expect(prismaService.anuncio.findUnique).toHaveBeenCalledWith({
        where: { id: 'anuncio-1' },
        include: { images: true },
      });
      expect(fileStorageService.upload).toHaveBeenCalledWith(mockFile, 'anuncios');
      expect(prismaService.anuncioImage.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if anuncio does not exist', async () => {
      prismaService.anuncio.findUnique.mockResolvedValue(null);

      await expect(useCase.execute('invalid-id', mockFile)).rejects.toThrow(
        NotFoundException,
      );
      expect(fileStorageService.upload).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if max images exceeded', async () => {
      const anuncioWithMaxImages = {
        ...mockAnuncio,
        images: Array(20).fill({ id: 'img' }),
      };
      prismaService.anuncio.findUnique.mockResolvedValue(anuncioWithMaxImages as any);

      await expect(useCase.execute('anuncio-1', mockFile)).rejects.toThrow(
        BadRequestException,
      );
      expect(fileStorageService.upload).not.toHaveBeenCalled();
    });

    it('should set isPrimary and remove from others when isPrimary=true', async () => {
      prismaService.anuncio.findUnique.mockResolvedValue(mockAnuncio as any);
      fileStorageService.upload.mockResolvedValue(mockUploadResult);
      prismaService.anuncioImage.updateMany.mockResolvedValue({ count: 2 } as any);
      prismaService.anuncioImage.create.mockResolvedValue({
        ...mockCreatedImage,
        isPrimary: true,
      } as any);

      await useCase.execute('anuncio-1', mockFile, true, 0);

      expect(prismaService.anuncioImage.updateMany).toHaveBeenCalledWith({
        where: { anuncioId: 'anuncio-1' },
        data: { isPrimary: false },
      });
    });

    it('should rollback on database save failure', async () => {
      prismaService.anuncio.findUnique.mockResolvedValue(mockAnuncio as any);
      fileStorageService.upload.mockResolvedValue(mockUploadResult);
      prismaService.anuncioImage.create.mockRejectedValue(new Error('DB Error'));

      await expect(useCase.execute('anuncio-1', mockFile)).rejects.toThrow('DB Error');

      // Verify rollback was attempted
      expect(fileStorageService.delete).toHaveBeenCalledWith(mockUploadResult.publicId);
    });

    it('should not fail if rollback fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      prismaService.anuncio.findUnique.mockResolvedValue(mockAnuncio as any);
      fileStorageService.upload.mockResolvedValue(mockUploadResult);
      prismaService.anuncioImage.create.mockRejectedValue(new Error('DB Error'));
      fileStorageService.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(useCase.execute('anuncio-1', mockFile)).rejects.toThrow('DB Error');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
