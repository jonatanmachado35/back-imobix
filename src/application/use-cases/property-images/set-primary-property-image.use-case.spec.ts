import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SetPrimaryPropertyImageUseCase } from './set-primary-property-image.use-case';
import { PropertyRepository } from '../../ports/property-repository';
import { PROPERTY_REPOSITORY } from '../../../properties/properties.tokens';

describe('SetPrimaryPropertyImageUseCase', () => {
  let useCase: SetPrimaryPropertyImageUseCase;
  let mockPropertyRepository: jest.Mocked<PropertyRepository>;

  const mockRepository = {
    findById: jest.fn(),
    findImageById: jest.fn(),
    clearImagePrimary: jest.fn(),
    setImagePrimary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetPrimaryPropertyImageUseCase,
        {
          provide: PROPERTY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<SetPrimaryPropertyImageUseCase>(SetPrimaryPropertyImageUseCase);
    mockPropertyRepository = module.get(PROPERTY_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set a property image as primary', async () => {
    mockPropertyRepository.findById.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as any);
    mockPropertyRepository.findImageById.mockResolvedValue({
      id: 'img-1',
      propertyId: 'property-1',
      isPrimary: false,
    } as any);
    mockPropertyRepository.setImagePrimary.mockResolvedValue(undefined as any);

    const result = await useCase.execute('property-1', 'img-1', 'owner-1');

    expect(mockPropertyRepository.clearImagePrimary).toHaveBeenCalledWith('property-1');
    expect(mockPropertyRepository.setImagePrimary).toHaveBeenCalledWith('img-1');
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

  it('should return image directly when already primary', async () => {
    const primaryImage = {
      id: 'img-1',
      propertyId: 'property-1',
      isPrimary: true,
    };

    mockPropertyRepository.findById.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as any);
    mockPropertyRepository.findImageById.mockResolvedValue(primaryImage as any);

    const result = await useCase.execute('property-1', 'img-1', 'owner-1');

    expect(result).toEqual(primaryImage);
    expect(mockPropertyRepository.clearImagePrimary).not.toHaveBeenCalled();
  });
});
