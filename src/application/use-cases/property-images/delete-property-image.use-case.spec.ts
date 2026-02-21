import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeletePropertyImageUseCase } from './delete-property-image.use-case';
import { PropertyRepository } from '../../ports/property-repository';
import { IFileStorageService } from '../../ports/file-storage.interface';
import { PROPERTY_REPOSITORY } from '../../../properties/properties.tokens';

describe('DeletePropertyImageUseCase', () => {
  let useCase: DeletePropertyImageUseCase;
  let mockPropertyRepository: jest.Mocked<PropertyRepository>;
  let mockFileStorageService: jest.Mocked<IFileStorageService>;

  const mockRepository = {
    findById: jest.fn(),
    findImageById: jest.fn(),
    deleteImage: jest.fn(),
    findImagesByPropertyId: jest.fn(),
    clearImagePrimary: jest.fn(),
    setImagePrimary: jest.fn(),
  };

  const mockFileStorage = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePropertyImageUseCase,
        {
          provide: PROPERTY_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: IFileStorageService,
          useValue: mockFileStorage,
        },
      ],
    }).compile();

    useCase = module.get<DeletePropertyImageUseCase>(DeletePropertyImageUseCase);
    mockPropertyRepository = module.get(PROPERTY_REPOSITORY);
    mockFileStorageService = module.get(IFileStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete property image when owner matches', async () => {
    mockPropertyRepository.findById.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as any);
    mockPropertyRepository.findImageById.mockResolvedValue({
      id: 'img-1',
      propertyId: 'property-1',
      publicId: 'properties/img-1',
      isPrimary: false,
    } as any);
    mockFileStorage.delete.mockResolvedValue(undefined);
    mockPropertyRepository.deleteImage.mockResolvedValue(undefined);

    await useCase.execute('property-1', 'img-1', 'owner-1');

    expect(mockFileStorage.delete).toHaveBeenCalledWith('properties/img-1');
    expect(mockPropertyRepository.deleteImage).toHaveBeenCalledWith('img-1');
  });

  it('should throw NotFoundException when property does not exist', async () => {
    mockPropertyRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('property-404', 'img-1', 'owner-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw ForbiddenException when user is not owner', async () => {
    mockPropertyRepository.findById.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-2',
    } as any);

    await expect(
      useCase.execute('property-1', 'img-1', 'owner-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should throw NotFoundException when image does not exist', async () => {
    mockPropertyRepository.findById.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as any);
    mockPropertyRepository.findImageById.mockResolvedValue(null);

    await expect(
      useCase.execute('property-1', 'img-404', 'owner-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should set next image as primary when deleting current primary image', async () => {
    mockPropertyRepository.findById.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as any);
    mockPropertyRepository.findImageById.mockResolvedValue({
      id: 'img-primary',
      propertyId: 'property-1',
      publicId: 'properties/img-primary',
      isPrimary: true,
    } as any);
    mockFileStorage.delete.mockResolvedValue(undefined);
    mockPropertyRepository.deleteImage.mockResolvedValue(undefined);
    mockPropertyRepository.findImagesByPropertyId.mockResolvedValue([
      { id: 'img-next', isPrimary: false } as any,
    ]);
    mockPropertyRepository.setImagePrimary.mockResolvedValue(undefined as any);

    await useCase.execute('property-1', 'img-primary', 'owner-1');

    expect(mockPropertyRepository.setImagePrimary).toHaveBeenCalledWith('img-next');
  });

  it('should continue deletion even when storage delete fails', async () => {
    mockPropertyRepository.findById.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as any);
    mockPropertyRepository.findImageById.mockResolvedValue({
      id: 'img-1',
      propertyId: 'property-1',
      publicId: 'properties/img-1',
      isPrimary: false,
    } as any);
    mockFileStorage.delete.mockRejectedValue(new Error('Storage down'));
    mockPropertyRepository.deleteImage.mockResolvedValue(undefined);

    await useCase.execute('property-1', 'img-1', 'owner-1');

    expect(mockPropertyRepository.deleteImage).toHaveBeenCalledWith('img-1');
  });
});
