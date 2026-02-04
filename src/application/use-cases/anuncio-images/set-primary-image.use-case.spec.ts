import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SetPrimaryImageUseCase } from './set-primary-image.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

describe('SetPrimaryImageUseCase', () => {
  let useCase: SetPrimaryImageUseCase;
  let prismaService: any;

  const mockPrismaService = {
    anuncioImage: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetPrimaryImageUseCase,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    useCase = module.get<SetPrimaryImageUseCase>(SetPrimaryImageUseCase);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockImage = {
      id: 'image-1',
      anuncioId: 'anuncio-1',
      publicId: 'anuncios/test123',
      url: 'http://cloudinary.com/test.jpg',
      secureUrl: 'https://cloudinary.com/test.jpg',
      format: 'jpg',
      width: 800,
      height: 600,
      bytes: 1024,
      displayOrder: 0,
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should set image as primary successfully', async () => {
      const updatedImage = { ...mockImage, isPrimary: true };

      prismaService.anuncioImage.findFirst.mockResolvedValue(mockImage as any);
      prismaService.$transaction.mockResolvedValue([{ count: 2 }, updatedImage]);

      const result = await useCase.execute('anuncio-1', 'image-1');

      expect(result).toEqual(updatedImage);
      expect(prismaService.anuncioImage.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'image-1',
          anuncioId: 'anuncio-1',
        },
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if image not found', async () => {
      prismaService.anuncioImage.findFirst.mockResolvedValue(null);

      await expect(useCase.execute('anuncio-1', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if image belongs to different anuncio', async () => {
      prismaService.anuncioImage.findFirst.mockResolvedValue(null);

      await expect(useCase.execute('wrong-anuncio', 'image-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should return image without changes if already primary', async () => {
      const primaryImage = { ...mockImage, isPrimary: true };

      prismaService.anuncioImage.findFirst.mockResolvedValue(primaryImage as any);

      const result = await useCase.execute('anuncio-1', 'image-1');

      expect(result).toEqual(primaryImage);
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should remove primary flag from other images when setting new primary', async () => {
      const updatedImage = { ...mockImage, isPrimary: true };

      prismaService.anuncioImage.findFirst.mockResolvedValue(mockImage as any);
      prismaService.$transaction.mockResolvedValue([{ count: 2 }, updatedImage]);

      await useCase.execute('anuncio-1', 'image-1');

      // Verifica que a transação foi chamada
      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);

      // Verifica que foi chamada com um array de 2 operações
      const transactionArg = prismaService.$transaction.mock.calls[0][0];
      expect(Array.isArray(transactionArg)).toBe(true);
      expect(transactionArg).toHaveLength(2);
    });

    it('should handle transaction rollback on failure', async () => {
      prismaService.anuncioImage.findFirst.mockResolvedValue(mockImage as any);
      prismaService.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(useCase.execute('anuncio-1', 'image-1')).rejects.toThrow(
        'Transaction failed',
      );
    });
  });
});
