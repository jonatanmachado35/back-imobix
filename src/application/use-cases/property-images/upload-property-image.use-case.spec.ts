import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UploadPropertyImageUseCase } from './upload-property-image.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IFileStorageService } from '../../ports/file-storage.interface';

describe('UploadPropertyImageUseCase', () => {
  let useCase: UploadPropertyImageUseCase;
  let prisma: any;
  let fileStorage: jest.Mocked<IFileStorageService>;

  const mockPrisma = {
    property: {
      findUnique: jest.fn(),
    },
    propertyImage: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockFileStorage = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
  };

  const file = {
    buffer: Buffer.from('fake-image'),
    originalname: 'praia.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
  };

  beforeEach(() => {
    prisma = mockPrisma;
    fileStorage = mockFileStorage;
    useCase = new UploadPropertyImageUseCase(
      prisma as unknown as PrismaService,
      fileStorage,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should upload a property image when property belongs to owner', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      images: [],
    } as never);

    fileStorage.upload.mockResolvedValue({
      publicId: 'properties/praia-1',
      url: 'http://cdn/praia-1.jpg',
      secureUrl: 'https://cdn/praia-1.jpg',
      format: 'jpg',
      width: 1200,
      height: 800,
      bytes: 1024,
    });

    prisma.propertyImage.create.mockResolvedValue({
      id: 'img-1',
      propertyId: 'property-1',
      publicId: 'properties/praia-1',
      url: 'http://cdn/praia-1.jpg',
      secureUrl: 'https://cdn/praia-1.jpg',
      format: 'jpg',
      width: 1200,
      height: 800,
      bytes: 1024,
      displayOrder: 0,
      isPrimary: false,
    } as never);

    const result = await useCase.execute('property-1', 'owner-1', file);

    expect(result.id).toBe('img-1');
    expect(prisma.property.findUnique).toHaveBeenCalledWith({
      where: { id: 'property-1' },
      include: { images: true },
    });
    expect(fileStorage.upload).toHaveBeenCalledWith(file, 'properties');
  });

  it('should throw NotFoundException when property does not exist', async () => {
    prisma.property.findUnique.mockResolvedValue(null as never);

    await expect(
      useCase.execute('property-404', 'owner-1', file),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(fileStorage.upload).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not property owner', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-2',
      images: [],
    } as never);

    await expect(
      useCase.execute('property-1', 'owner-1', file),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(fileStorage.upload).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when max images is exceeded', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      images: Array(20).fill({ id: 'img' }),
    } as never);

    await expect(
      useCase.execute('property-1', 'owner-1', file),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fileStorage.upload).not.toHaveBeenCalled();
  });

  it('should clear previous primary image when uploading new primary image', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      images: [{ id: 'img-old' }],
    } as never);

    fileStorage.upload.mockResolvedValue({
      publicId: 'properties/praia-1',
      url: 'http://cdn/praia-1.jpg',
      secureUrl: 'https://cdn/praia-1.jpg',
      format: 'jpg',
      width: 1200,
      height: 800,
      bytes: 1024,
    });

    prisma.propertyImage.create.mockResolvedValue({
      id: 'img-1',
      propertyId: 'property-1',
      isPrimary: true,
    } as never);

    await useCase.execute('property-1', 'owner-1', file, true, 0);

    expect(prisma.propertyImage.updateMany).toHaveBeenCalledWith({
      where: { propertyId: 'property-1' },
      data: { isPrimary: false },
    });
  });

  it('should rollback storage upload when database create fails', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      images: [],
    } as never);

    fileStorage.upload.mockResolvedValue({
      publicId: 'properties/praia-1',
      url: 'http://cdn/praia-1.jpg',
      secureUrl: 'https://cdn/praia-1.jpg',
      format: 'jpg',
      width: 1200,
      height: 800,
      bytes: 1024,
    });

    prisma.propertyImage.create.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute('property-1', 'owner-1', file)).rejects.toThrow(
      'DB error',
    );

    expect(fileStorage.delete).toHaveBeenCalledWith('properties/praia-1');
  });

  it('should keep original error when rollback delete fails', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      images: [],
    } as never);

    fileStorage.upload.mockResolvedValue({
      publicId: 'properties/praia-1',
      url: 'http://cdn/praia-1.jpg',
      secureUrl: 'https://cdn/praia-1.jpg',
      format: 'jpg',
      width: 1200,
      height: 800,
      bytes: 1024,
    });
    prisma.propertyImage.create.mockRejectedValue(new Error('DB error'));
    fileStorage.delete.mockRejectedValue(new Error('Delete error'));

    await expect(useCase.execute('property-1', 'owner-1', file)).rejects.toThrow(
      'DB error',
    );
  });
});
