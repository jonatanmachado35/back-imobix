import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UploadPropertyImageUseCase } from './upload-property-image.use-case';
import { PropertyRepository } from '../../ports/property-repository';
import { IFileStorageService } from '../../ports/file-storage.interface';

describe('UploadPropertyImageUseCase', () => {
  let useCase: UploadPropertyImageUseCase;
  let propertyRepository: jest.Mocked<PropertyRepository>;
  let fileStorage: jest.Mocked<IFileStorageService>;

  const mockPropertyRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByOwner: jest.fn(),
    countByOwner: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    hasConflictingBooking: jest.fn(),
    findImagesByPropertyId: jest.fn(),
    findImageById: jest.fn(),
    createImage: jest.fn(),
    deleteImage: jest.fn(),
    clearImagePrimary: jest.fn(),
    setImagePrimary: jest.fn(),
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
    propertyRepository = mockPropertyRepository;
    fileStorage = mockFileStorage;
    useCase = new UploadPropertyImageUseCase(
      propertyRepository,
      fileStorage,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should upload a property image when property belongs to owner', async () => {
    propertyRepository.findById.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      images: [],
    } as any);

    fileStorage.upload.mockResolvedValue({
      publicId: 'properties/praia-1',
      url: 'http://cdn/praia-1.jpg',
      secureUrl: 'https://cdn/praia-1.jpg',
      format: 'jpg',
      width: 1200,
      height: 800,
      bytes: 1024,
    });

    propertyRepository.createImage.mockResolvedValue({
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
    } as any);

    const result = await useCase.execute('property-1', 'owner-1', file);

    expect(result.id).toBe('img-1');
    expect(propertyRepository.findById).toHaveBeenCalledWith('property-1');
    expect(fileStorage.upload).toHaveBeenCalledWith(file, 'properties');
  });

  it('should throw NotFoundException when property does not exist', async () => {
    propertyRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('property-404', 'owner-1', file),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(fileStorage.upload).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not property owner', async () => {
    propertyRepository.findById.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-2',
      images: [],
    } as any);

    await expect(
      useCase.execute('property-1', 'owner-1', file),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(fileStorage.upload).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when max images is exceeded', async () => {
    propertyRepository.findById.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      images: Array(20).fill({ id: 'img' }),
    } as any);

    await expect(
      useCase.execute('property-1', 'owner-1', file),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fileStorage.upload).not.toHaveBeenCalled();
  });

  it('should clear previous primary image when uploading new primary image', async () => {
    propertyRepository.findById.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      images: [{ id: 'img-old' }],
    } as any);

    fileStorage.upload.mockResolvedValue({
      publicId: 'properties/praia-1',
      url: 'http://cdn/praia-1.jpg',
      secureUrl: 'https://cdn/praia-1.jpg',
      format: 'jpg',
      width: 1200,
      height: 800,
      bytes: 1024,
    });

    propertyRepository.createImage.mockResolvedValue({
      id: 'img-1',
      propertyId: 'property-1',
      isPrimary: true,
    } as any);

    await useCase.execute('property-1', 'owner-1', file, true, 0);

    expect(propertyRepository.clearImagePrimary).toHaveBeenCalledWith('property-1');
  });

  it('should rollback storage upload when database create fails', async () => {
    propertyRepository.findById.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      images: [],
    } as any);

    fileStorage.upload.mockResolvedValue({
      publicId: 'properties/praia-1',
      url: 'http://cdn/praia-1.jpg',
      secureUrl: 'https://cdn/praia-1.jpg',
      format: 'jpg',
      width: 1200,
      height: 800,
      bytes: 1024,
    });

    propertyRepository.createImage.mockRejectedValue(new Error('DB error'));

    await expect(
      useCase.execute('property-1', 'owner-1', file),
    ).rejects.toThrow('DB error');

    expect(fileStorage.delete).toHaveBeenCalledWith('properties/praia-1');
  });
});
