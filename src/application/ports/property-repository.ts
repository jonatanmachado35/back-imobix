import { Property } from '../../domain/entities/property';

export type CreatePropertyData = {
  ownerId: string;
  type: string;
  title: string;
  description?: string | null;
  price?: number | null;
  pricePerNight?: number | null;
  holidayPrice?: number | null;
  address?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  area?: number | null;
  amenities?: string[];
  petFriendly?: boolean;
  furnished?: boolean;
  minNights?: number | null;
  maxGuests?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  houseRules?: string[];
  category?: string | null;
  blockedDates?: string[];
};

export type UpdatePropertyData = Partial<CreatePropertyData>;

export type PropertyFilters = {
  type?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  status?: string;
  ownerId?: string;
};

export interface PropertyRepository {
  findById(id: string): Promise<Property | null>;
  findAll(filters?: PropertyFilters): Promise<Property[]>;
  findByOwner(ownerId: string): Promise<Property[]>;
  countByOwner(ownerId: string): Promise<number>;
  create(data: CreatePropertyData): Promise<Property>;
  update(id: string, data: UpdatePropertyData): Promise<Property>;
  updateStatus(id: string, status: string): Promise<Property>;
  delete(id: string): Promise<void>;
  hasConflictingBooking(propertyId: string, checkIn: Date, checkOut: Date): Promise<boolean>;
}
