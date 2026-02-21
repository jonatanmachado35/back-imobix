import { Property } from '../../domain/entities/property';
import { PropertyImage } from '@prisma/client';
import { PropertyType, PropertyCategory, PropertyStatus } from '../../domain/entities/property';

export type CreatePropertyData = {
  ownerId: string;
  type: PropertyType;
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
  category?: PropertyCategory | null;
  blockedDates?: string[];
};

export type UpdatePropertyData = Partial<CreatePropertyData> & {
  status?: PropertyStatus;
};

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
  updateStatus(id: string, status: PropertyStatus): Promise<Property>;
  delete(id: string): Promise<void>;
  hasConflictingBooking(propertyId: string, checkIn: Date, checkOut: Date): Promise<boolean>;
  
  // Image methods
  findImagesByPropertyId(propertyId: string): Promise<PropertyImage[]>;
  findImageById(imageId: string, propertyId: string): Promise<PropertyImage | null>;
  createImage(data: {
    propertyId: string;
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    width?: number;
    height?: number;
    bytes?: number;
    displayOrder?: number;
    isPrimary?: boolean;
  }): Promise<PropertyImage>;
  deleteImage(imageId: string): Promise<void>;
  clearImagePrimary(propertyId: string): Promise<void>;
  setImagePrimary(imageId: string): Promise<PropertyImage>;
}
