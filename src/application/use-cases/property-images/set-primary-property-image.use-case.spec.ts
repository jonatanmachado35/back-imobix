import { SetPrimaryPropertyImageUseCase } from './set-primary-property-image.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('SetPrimaryPropertyImageUseCase', () => {
  let useCase: SetPrimaryPropertyImageUseCase;
  let prisma: any;

  const mockPrisma = {
    property: {
      findUnique: jest.fn(),
    },
    propertyImage: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    prisma = mockPrisma;
    useCase = new SetPrimaryPropertyImageUseCase(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set a property image as primary', async () => {
    prisma.property.findUnique.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as never);
    prisma.propertyImage.findFirst.mockResolvedValue({
      id: 'img-1',
      propertyId: 'property-1',
      isPrimary: false,
    } as never);

    const updated = { id: 'img-1', isPrimary: true };

    prisma.$transaction.mockImplementation(async (operations: Promise<any>[]) => {
      const results = [];
      for (const operation of operations) {
        results.push(await operation);
      }
      return [{ count: 2 }, updated];
    });

    prisma.propertyImage.updateMany.mockResolvedValue({ count: 2 } as never);
    prisma.propertyImage.update.mockResolvedValue(updated as never);

    const result = await useCase.execute('property-1', 'img-1', 'owner-1');

    expect(result).toEqual(updated);
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

  it('should return image directly when already primary', async () => {
    const primaryImage = {
      id: 'img-1',
      propertyId: 'property-1',
      isPrimary: true,
    };

    prisma.property.findUnique.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' } as never);
    prisma.propertyImage.findFirst.mockResolvedValue(primaryImage as never);

    const result = await useCase.execute('property-1', 'img-1', 'owner-1');

    expect(result).toEqual(primaryImage);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
