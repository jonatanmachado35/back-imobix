import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ListAnuncioImagesUseCase } from './list-anuncio-images.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

describe('ListAnuncioImagesUseCase', () => {
  let useCase: ListAnuncioImagesUseCase;
  let prismaService: any;

  const mockPrismaService = {
    anuncio: {
      findUnique: jest.fn(),
    },
    anuncioImage: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListAnuncioImagesUseCase,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    useCase = module.get<ListAnuncioImagesUseCase>(ListAnuncioImagesUseCase);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockAnuncio = {
      id: 'anuncio-1',
      titulo: 'Test Anuncio',
      tipo: 'CASA',
      endereco: 'Rua Teste, 123',
      cidade: 'Florianópolis',
      estado: 'SC',
      valor: 500000,
    };

    const mockImages = [
      {
        id: 'image-1',
        anuncioId: 'anuncio-1',
        publicId: 'anuncios/test123',
        url: 'http://cloudinary.com/test1.jpg',
        secureUrl: 'https://cloudinary.com/test1.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 1024,
        displayOrder: 0,
        isPrimary: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
      {
        id: 'image-2',
        anuncioId: 'anuncio-1',
        publicId: 'anuncios/test456',
        url: 'http://cloudinary.com/test2.jpg',
        secureUrl: 'https://cloudinary.com/test2.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 2048,
        displayOrder: 1,
        isPrimary: false,
        createdAt: new Date('2026-01-02'),
        updatedAt: new Date('2026-01-02'),
      },
      {
        id: 'image-3',
        anuncioId: 'anuncio-1',
        publicId: 'anuncios/test789',
        url: 'http://cloudinary.com/test3.jpg',
        secureUrl: 'https://cloudinary.com/test3.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 3072,
        displayOrder: 2,
        isPrimary: false,
        createdAt: new Date('2026-01-03'),
        updatedAt: new Date('2026-01-03'),
      },
    ];

    it('should list all images of an anuncio', async () => {
      prismaService.anuncio.findUnique.mockResolvedValue(mockAnuncio as any);
      prismaService.anuncioImage.findMany.mockResolvedValue(mockImages as any);

      const result = await useCase.execute('anuncio-1');

      expect(result).toEqual(mockImages);
      expect(prismaService.anuncio.findUnique).toHaveBeenCalledWith({
        where: { id: 'anuncio-1' },
      });
      expect(prismaService.anuncioImage.findMany).toHaveBeenCalledWith({
        where: { anuncioId: 'anuncio-1' },
        orderBy: [
          { isPrimary: 'desc' },
          { displayOrder: 'asc' },
          { createdAt: 'asc' },
        ],
      });
    });

    it('should throw NotFoundException if anuncio does not exist', async () => {
      prismaService.anuncio.findUnique.mockResolvedValue(null);

      await expect(useCase.execute('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.anuncioImage.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array if anuncio has no images', async () => {
      prismaService.anuncio.findUnique.mockResolvedValue(mockAnuncio as any);
      prismaService.anuncioImage.findMany.mockResolvedValue([]);

      const result = await useCase.execute('anuncio-1');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should order images with primary first', async () => {
      const unorderedImages = [
        { ...mockImages[1], displayOrder: 0, isPrimary: false },
        { ...mockImages[2], displayOrder: 1, isPrimary: false },
        { ...mockImages[0], displayOrder: 2, isPrimary: true },
      ];

      prismaService.anuncio.findUnique.mockResolvedValue(mockAnuncio as any);
      prismaService.anuncioImage.findMany.mockResolvedValue(mockImages as any);

      const result = await useCase.execute('anuncio-1');

      // Verifica que a primeira imagem retornada é a primária
      expect(result[0].isPrimary).toBe(true);

      // Verifica a ordem de classificação solicitada
      expect(prismaService.anuncioImage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { isPrimary: 'desc' },
            { displayOrder: 'asc' },
            { createdAt: 'asc' },
          ],
        }),
      );
    });

    it('should handle large number of images', async () => {
      const manyImages = Array.from({ length: 20 }, (_, i) => ({
        id: `image-${i + 1}`,
        anuncioId: 'anuncio-1',
        publicId: `anuncios/test${i + 1}`,
        url: `http://cloudinary.com/test${i + 1}.jpg`,
        secureUrl: `https://cloudinary.com/test${i + 1}.jpg`,
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 1024 * (i + 1),
        displayOrder: i,
        isPrimary: i === 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      prismaService.anuncio.findUnique.mockResolvedValue(mockAnuncio as any);
      prismaService.anuncioImage.findMany.mockResolvedValue(manyImages as any);

      const result = await useCase.execute('anuncio-1');

      expect(result).toHaveLength(20);
      expect(result[0].isPrimary).toBe(true);
    });
  });
});
