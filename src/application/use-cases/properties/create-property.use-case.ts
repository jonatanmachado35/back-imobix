import { Property, PropertyType } from '../../../domain/entities/property';
import { PropertyRepository } from '../../ports/property-repository';

export class PropertyNotFoundError extends Error {
  constructor(propertyId: string) {
    super(`Property not found: ${propertyId}`);
    this.name = 'PropertyNotFoundError';
  }
}

export class InvalidPropertyInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPropertyInputError';
  }
}

export interface CreatePropertyInput {
  ownerId: string;
  type: string;
  title: string;
  description?: string;
  price?: number;
  pricePerNight?: number;
  holidayPrice?: number;
  address?: string;
  city?: string;
  neighborhood?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  area?: number;
  amenities?: string[];
  petFriendly?: boolean;
  furnished?: boolean;
  minNights?: number;
  maxGuests?: number;
  checkInTime?: string;
  checkOutTime?: string;
  houseRules?: string[];
  category?: string;
  blockedDates?: string[];
}

export class CreatePropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) { }

  async execute(input: CreatePropertyInput): Promise<Property> {
    // Validation
    if (!input.title || input.title.trim().length === 0) {
      throw new InvalidPropertyInputError('Title is required');
    }

    const propertyType = input.type as PropertyType;

    if (propertyType === PropertyType.TEMPORADA) {
      if (!input.pricePerNight || input.pricePerNight <= 0) {
        throw new InvalidPropertyInputError('pricePerNight is required for TEMPORADA');
      }
    } else {
      if (!input.price || input.price <= 0) {
        throw new InvalidPropertyInputError('price is required for VENDA/ALUGUEL');
      }
    }

    const property = await this.propertyRepository.create({
      ownerId: input.ownerId,
      type: input.type,
      title: input.title.trim(),
      description: input.description,
      price: input.price,
      pricePerNight: input.pricePerNight,
      holidayPrice: input.holidayPrice,
      address: input.address,
      city: input.city,
      neighborhood: input.neighborhood,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      parkingSpaces: input.parkingSpaces,
      area: input.area,
      amenities: input.amenities,
      petFriendly: input.petFriendly,
      furnished: input.furnished,
      minNights: input.minNights,
      maxGuests: input.maxGuests,
      checkInTime: input.checkInTime,
      checkOutTime: input.checkOutTime,
      houseRules: input.houseRules,
      category: input.category,
      blockedDates: input.blockedDates,
    });

    return property;
  }
}
