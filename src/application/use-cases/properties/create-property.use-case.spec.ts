import { CreatePropertyUseCase, CreatePropertyInput, PropertyNotFoundError } from './create-property.use-case';
import { PropertyRepository } from '../../ports/property-repository';
import { Property, PropertyType, PropertyStatus } from '../../../domain/entities/property';

describe('CreatePropertyUseCase', () => {
  let useCase: CreatePropertyUseCase;
  let mockPropertyRepository: jest.Mocked<PropertyRepository>;

  const mockProperty = new Property({
    id: 'prop-123',
    ownerId: 'user-123',
    type: PropertyType.TEMPORADA,
    status: PropertyStatus.ATIVO,
    title: 'Casa na Praia',
    description: 'Linda casa',
    pricePerNight: 500,
    city: 'Florianópolis',
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 8,
    minNights: 2,
    amenities: ['wifi', 'piscina'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockPropertyRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByOwner: jest.fn(),
      countByOwner: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
      hasConflictingBooking: jest.fn(),
    };

    useCase = new CreatePropertyUseCase(mockPropertyRepository);
  });

  describe('Happy Path', () => {
    it('should create a TEMPORADA property successfully', async () => {
      const input: CreatePropertyInput = {
        ownerId: 'user-123',
        type: 'TEMPORADA',
        title: 'Casa na Praia',
        description: 'Linda casa',
        pricePerNight: 500,
        city: 'Florianópolis',
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 8,
        minNights: 2,
        amenities: ['wifi', 'piscina'],
      };

      mockPropertyRepository.create.mockResolvedValue(mockProperty);

      const result = await useCase.execute(input);

      expect(result.id).toBe('prop-123');
      expect(result.title).toBe('Casa na Praia');
      expect(result.type).toBe(PropertyType.TEMPORADA);
      expect(mockPropertyRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ownerId: 'user-123',
        type: 'TEMPORADA',
        title: 'Casa na Praia',
      }));
    });

    it('should create a VENDA property successfully', async () => {
      const vendaProperty = new Property({
        id: 'prop-456',
        ownerId: 'user-123',
        type: PropertyType.VENDA,
        status: PropertyStatus.ATIVO,
        title: 'Apartamento Centro',
        price: 500000,
        city: 'São Paulo',
        bedrooms: 2,
        bathrooms: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input: CreatePropertyInput = {
        ownerId: 'user-123',
        type: 'VENDA',
        title: 'Apartamento Centro',
        price: 500000,
        city: 'São Paulo',
        bedrooms: 2,
        bathrooms: 1,
      };

      mockPropertyRepository.create.mockResolvedValue(vendaProperty);

      const result = await useCase.execute(input);

      expect(result.type).toBe(PropertyType.VENDA);
      expect(result.price).toBe(500000);
    });
  });

  describe('Validation Errors', () => {
    it('should throw if title is empty', async () => {
      const input: CreatePropertyInput = {
        ownerId: 'user-123',
        type: 'TEMPORADA',
        title: '',
        pricePerNight: 500,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Title is required');
    });

    it('should throw if TEMPORADA without pricePerNight', async () => {
      const input: CreatePropertyInput = {
        ownerId: 'user-123',
        type: 'TEMPORADA',
        title: 'Casa na Praia',
      };

      await expect(useCase.execute(input)).rejects.toThrow('pricePerNight is required');
    });

    it('should throw if VENDA without price', async () => {
      const input: CreatePropertyInput = {
        ownerId: 'user-123',
        type: 'VENDA',
        title: 'Apartamento',
      };

      await expect(useCase.execute(input)).rejects.toThrow('price is required');
    });
  });
});
