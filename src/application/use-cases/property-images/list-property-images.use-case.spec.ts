import { ListPropertyImagesUseCase } from './list-property-images.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ListPropertyImagesUseCase', () => {
  let useCase: ListPropertyImagesUseCase;
  let prisma: any;

  const mockPrisma = {
    property: {
      findUnique: jest.fn(),
    },
    propertyImage: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    prisma = mockPrisma;
    useCase = new ListPropertyImagesUseCase(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list property images ordered by primary and displayOrder', async () => {
    prisma.property.findUnique.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as never);
    prisma.propertyImage.findMany.mockResolvedValue([
      { id: 'img-primary', isPrimary: true, displayOrder: 2 },
      { id: 'img-2', isPrimary: false, displayOrder: 1 },
    ] as never);

    const result = await useCase.execute('property-1', 'owner-1');

    expect(result).toHaveLength(2);
    expect(prisma.propertyImage.findMany).toHaveBeenCalledWith({
      where: { propertyId: 'property-1' },
      orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  });

  it('should throw NotFoundException when property does not exist', async () => {
    prisma.property.findUnique.mockResolvedValue(null as never);

    await expect(useCase.execute('property-1', 'owner-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.propertyImage.findMany).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is not owner', async () => {
    prisma.property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-2',
    } as never);

    await expect(useCase.execute('property-1', 'owner-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(prisma.propertyImage.findMany).not.toHaveBeenCalled();
  });
});
