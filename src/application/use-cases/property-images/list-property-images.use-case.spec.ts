import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ListPropertyImagesUseCase } from './list-property-images.use-case';
import { PropertyRepository } from '../../ports/property-repository';
import { PROPERTY_REPOSITORY } from '../../../properties/properties.tokens';

describe('ListPropertyImagesUseCase', () => {
  let useCase: ListPropertyImagesUseCase;
  let mockPropertyRepository: jest.Mocked<PropertyRepository>;

  const mockRepository = {
    findById: jest.fn(),
    findImagesByPropertyId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListPropertyImagesUseCase,
        {
          provide: PROPERTY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListPropertyImagesUseCase>(ListPropertyImagesUseCase);
    mockPropertyRepository = module.get(PROPERTY_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list property images ordered by primary and displayOrder', async () => {
    mockPropertyRepository.findById.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as any);
    mockPropertyRepository.findImagesByPropertyId.mockResolvedValue([
      { id: 'img-primary', isPrimary: true, displayOrder: 2 },
      { id: 'img-2', isPrimary: false, displayOrder: 1 },
    ] as any);

    const result = await useCase.execute('property-1', 'owner-1');

    expect(result).toHaveLength(2);
    expect(mockPropertyRepository.findImagesByPropertyId).toHaveBeenCalledWith('property-1');
  });

  it('should throw NotFoundException when property does not exist', async () => {
    mockPropertyRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('property-1', 'owner-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(mockPropertyRepository.findImagesByPropertyId).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not owner', async () => {
    mockPropertyRepository.findById.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-2',
    } as any);

    await expect(useCase.execute('property-1', 'owner-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(mockPropertyRepository.findImagesByPropertyId).not.toHaveBeenCalled();
  });
});
