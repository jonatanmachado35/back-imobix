import { DeletePropertyImageUseCase } from './delete-property-image.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IFileStorageService } from '../../ports/file-storage.interface';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('DeletePropertyImageUseCase', () => {
  let useCase: DeletePropertyImageUseCase;
  let prisma: any;
  let fileStorage: jest.Mocked<IFileStorageService>;

  const mockPrisma = {
    property: {
      findUnique: jest.fn(),
    },
    propertyImage: {
      findFirst: jest.fn(),
      delete: jest.fn(),
      findFirstOrThrow: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockFileStorage = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
  };

  beforeEach(() => {
    prisma = mockPrisma;
    fileStorage = mockFileStorage;
    useCase = new DeletePropertyImageUseCase(
      prisma as unknown as PrismaService,
      fileStorage,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete property image when owner matches', async () => {
    prisma.property.findUnique.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as never);
    prisma.propertyImage.findFirst.mockResolvedValue({
      id: 'img-1',
      propertyId: 'property-1',
      publicId: 'properties/img-1',
      isPrimary: false,
    } as never);

    await useCase.execute('property-1', 'img-1', 'owner-1');

    expect(fileStorage.delete).toHaveBeenCalledWith('properties/img-1');
    expect(prisma.propertyImage.delete).toHaveBeenCalledWith({ where: { id: 'img-1' } });
  });

  it('should throw NotFoundException when property does not exist', async () => {
    prisma.property.findUnique.mockResolvedValue(null as never);

    await expect(
      useCase.execute('property-404', 'img-1', 'owner-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw ForbiddenException when user is not owner', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-2',
    } as never);

    await expect(
      useCase.execute('property-1', 'img-1', 'owner-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should throw NotFoundException when image does not exist', async () => {
    prisma.property.findUnique.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as never);
    prisma.propertyImage.findFirst.mockResolvedValue(null as never);

    await expect(
      useCase.execute('property-1', 'img-404', 'owner-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should set next image as primary when deleting current primary image', async () => {
    prisma.property.findUnique.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as never);
    prisma.propertyImage.findFirst
      .mockResolvedValueOnce({
        id: 'img-primary',
        propertyId: 'property-1',
        publicId: 'properties/img-primary',
        isPrimary: true,
      } as never)
      .mockResolvedValueOnce({
        id: 'img-next',
        propertyId: 'property-1',
      } as never);

    await useCase.execute('property-1', 'img-primary', 'owner-1');

    expect(prisma.propertyImage.update).toHaveBeenCalledWith({
      where: { id: 'img-next' },
      data: { isPrimary: true },
    });
  });

  it('should continue deletion even when storage delete fails', async () => {
    prisma.property.findUnique.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as never);
    prisma.propertyImage.findFirst.mockResolvedValue({
      id: 'img-1',
      propertyId: 'property-1',
      publicId: 'properties/img-1',
      isPrimary: false,
    } as never);
    fileStorage.delete.mockRejectedValue(new Error('Storage down'));

    await useCase.execute('property-1', 'img-1', 'owner-1');

    expect(prisma.propertyImage.delete).toHaveBeenCalledWith({ where: { id: 'img-1' } });
  });
});
