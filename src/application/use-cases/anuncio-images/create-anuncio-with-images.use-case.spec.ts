import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreateAnuncioWithImagesUseCase } from './create-anuncio-with-images.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IFileStorageService, FileUploadDto } from '../../ports/file-storage.interface';
import { CreateAnuncioDto } from '../../../real-estate/dto/create-anuncio.dto';

describe('CreateAnuncioWithImagesUseCase', () => {
  let useCase: CreateAnuncioWithImagesUseCase;
  let prismaService: any;
  let fileStorageService: jest.Mocked<IFileStorageService>;

  const mockPrismaService = {
    anuncio: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    anuncioImage: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockFileStorageService = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAnuncioWithImagesUseCase,
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

    useCase = module.get<CreateAnuncioWithImagesUseCase>(CreateAnuncioWithImagesUseCase);
    prismaService = module.get(PrismaService);
    fileStorageService = module.get(IFileStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockCreateDto: CreateAnuncioDto = {
      titulo: 'Casa na Praia',
      tipo: 'CASA_PRAIA',
      endereco: 'Rua da Praia, 123',
      cidade: 'Florianópolis',
      estado: 'SC',
      valorDiaria: 500,
      valorDiariaFimSemana: 600,
      capacidadeHospedes: 6,
      quartos: 3,
      camas: 4,
      banheiros: 2,
    };

    const mockFiles: FileUploadDto[] = [
      {
        buffer: Buffer.from('test1'),
        originalname: 'casa1.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      },
      {
        buffer: Buffer.from('test2'),
        originalname: 'casa2.jpg',
        mimetype: 'image/jpeg',
        size: 2048,
      },
    ];

    const mockUploadResults = [
      {
        public_id: 'anuncios/test123',
        publicId: 'anuncios/test123',
        url: 'http://cloudinary.com/test1.jpg',
        secure_url: 'https://cloudinary.com/test1.jpg',
        secureUrl: 'https://cloudinary.com/test1.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 1024,
      },
      {
        public_id: 'anuncios/test456',
        publicId: 'anuncios/test456',
        url: 'http://cloudinary.com/test2.jpg',
        secure_url: 'https://cloudinary.com/test2.jpg',
        secureUrl: 'https://cloudinary.com/test2.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 2048,
      },
    ];

    const mockCreatedAnuncio = {
      id: 'anuncio-1',
      titulo: 'Casa na Praia',
      tipo: 'CASA_PRAIA',
      endereco: 'Rua da Praia, 123',
      cidade: 'Florianópolis',
      estado: 'SC',
      valor: 500,
      status: 'ATIVO',
      descricao: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [
        {
          id: 'image-1',
          anuncioId: 'anuncio-1',
          ...mockUploadResults[0],
          displayOrder: 0,
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'image-2',
          anuncioId: 'anuncio-1',
          ...mockUploadResults[1],
          displayOrder: 1,
          isPrimary: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    it('should throw BadRequestException if no images provided', async () => {
      await expect(useCase.execute(mockCreateDto, [])).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(mockCreateDto, [])).rejects.toThrow(
        'Pelo menos 1 imagem é obrigatória',
      );

      expect(fileStorageService.upload).not.toHaveBeenCalled();
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if more than 20 images', async () => {
      const manyFiles = Array(21).fill(mockFiles[0]);

      await expect(useCase.execute(mockCreateDto, manyFiles)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(mockCreateDto, manyFiles)).rejects.toThrow(
        'Máximo de 20 imagens permitido',
      );

      expect(fileStorageService.upload).not.toHaveBeenCalled();
    });

    it('should create anuncio with images successfully', async () => {
      fileStorageService.upload
        .mockResolvedValueOnce(mockUploadResults[0])
        .mockResolvedValueOnce(mockUploadResults[1]);

      prismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(prismaService);
      });

      prismaService.anuncio.create.mockResolvedValue({
        id: 'anuncio-1',
        titulo: mockCreateDto.titulo,
        tipo: mockCreateDto.tipo,
        endereco: mockCreateDto.endereco,
        cidade: mockCreateDto.cidade,
        estado: mockCreateDto.estado,
        valor: mockCreateDto.valorDiaria,
        status: 'ATIVO',
        descricao: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaService.anuncio.findUnique.mockResolvedValue(mockCreatedAnuncio);

      const result = await useCase.execute(mockCreateDto, mockFiles);

      expect(result).toEqual(mockCreatedAnuncio);
      expect(fileStorageService.upload).toHaveBeenCalledTimes(2);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.anuncio.create).toHaveBeenCalled();
      expect(prismaService.anuncio.findUnique).toHaveBeenCalledWith({
        where: { id: 'anuncio-1' },
        include: { images: true },
      });
    });

    it('should rollback cloudinary uploads if database transaction fails', async () => {
      fileStorageService.upload
        .mockResolvedValueOnce(mockUploadResults[0])
        .mockResolvedValueOnce(mockUploadResults[1]);

      prismaService.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(mockCreateDto, mockFiles)).rejects.toThrow(
        'Database error',
      );

      // Verificar que rollback foi executado
      expect(fileStorageService.delete).toHaveBeenCalledTimes(2);
      expect(fileStorageService.delete).toHaveBeenCalledWith('anuncios/test123');
      expect(fileStorageService.delete).toHaveBeenCalledWith('anuncios/test456');
    });
  });
});
