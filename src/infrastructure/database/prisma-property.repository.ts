import { Injectable } from '@nestjs/common';
import { Property, PropertyType, PropertyStatus, PropertyCategory } from '../../domain/entities/property';
import { PropertyRepository, CreatePropertyData, UpdatePropertyData, PropertyFilters } from '../../application/ports/property-repository';
import { PrismaService } from './prisma.service';
import { PropertyImage } from '@prisma/client';

@Injectable()
export class PrismaPropertyRepository implements PropertyRepository {
  constructor(private readonly prisma: PrismaService) { }

  private toDomain(data: any): Property {
    return new Property({
      id: data.id,
      ownerId: data.ownerId,
      type: data.type as PropertyType,
      status: data.status as PropertyStatus,
      title: data.title,
      description: data.description,
      price: data.price ? Number(data.price) : null,
      currency: data.currency,
      pricePerNight: data.pricePerNight ? Number(data.pricePerNight) : null,
      holidayPrice: data.holidayPrice ? Number(data.holidayPrice) : null,
      address: data.address,
      city: data.city,
      neighborhood: data.neighborhood,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      parkingSpaces: data.parkingSpaces,
      area: data.area,
      rating: data.rating,
      reviewCount: data.reviewCount,
      amenities: data.amenities,
      petFriendly: data.petFriendly,
      furnished: data.furnished,
      minNights: data.minNights,
      maxGuests: data.maxGuests,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      houseRules: data.houseRules,
      category: data.category as PropertyCategory,
      blockedDates: data.blockedDates,
      images: Array.isArray(data.images)
        ? data.images.map((image: any) => image.secureUrl ?? image.url)
        : [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findById(id: string): Promise<Property | null> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });
    return property ? this.toDomain(property) : null;
  }

  async findAll(filters?: PropertyFilters): Promise<Property[]> {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }
    if (filters?.status) {
      where.status = filters.status;
    } else {
      where.status = 'ATIVO'; // Default to active properties
    }
    if (filters?.bedrooms) {
      where.bedrooms = { gte: filters.bedrooms };
    }
    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }
    if (filters?.minPrice || filters?.maxPrice) {
      where.OR = [
        {
          price: {
            ...(filters.minPrice && { gte: filters.minPrice }),
            ...(filters.maxPrice && { lte: filters.maxPrice }),
          },
        },
        {
          pricePerNight: {
            ...(filters.minPrice && { gte: filters.minPrice }),
            ...(filters.maxPrice && { lte: filters.maxPrice }),
          },
        },
      ];
    }

    const properties = await this.prisma.property.findMany({
      where,
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });

    return properties.map((p) => this.toDomain(p));
  }

  async findByOwner(ownerId: string): Promise<Property[]> {
    const properties = await this.prisma.property.findMany({
      where: { ownerId },
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });
    return properties.map((p) => this.toDomain(p));
  }

  async countByOwner(ownerId: string): Promise<number> {
    return this.prisma.property.count({
      where: { ownerId },
    });
  }

  async create(data: CreatePropertyData): Promise<Property> {
    const property = await this.prisma.property.create({
      data: {
        ownerId: data.ownerId,
        type: data.type,
        title: data.title,
        description: data.description,
        price: data.price,
        pricePerNight: data.pricePerNight,
        holidayPrice: data.holidayPrice,
        address: data.address,
        city: data.city,
        neighborhood: data.neighborhood,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        parkingSpaces: data.parkingSpaces || 0,
        area: data.area,
        amenities: data.amenities || [],
        petFriendly: data.petFriendly || false,
        furnished: data.furnished || false,
        minNights: data.minNights,
        maxGuests: data.maxGuests,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        houseRules: data.houseRules || [],
        category: data.category,
        blockedDates: data.blockedDates || [],
      },
    });
    return this.toDomain(property);
  }

  async update(id: string, data: UpdatePropertyData): Promise<Property> {
    const property = await this.prisma.property.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.pricePerNight !== undefined && { pricePerNight: data.pricePerNight }),
        ...(data.holidayPrice !== undefined && { holidayPrice: data.holidayPrice }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.neighborhood !== undefined && { neighborhood: data.neighborhood }),
        ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms }),
        ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms }),
        ...(data.parkingSpaces !== undefined && { parkingSpaces: data.parkingSpaces }),
        ...(data.area !== undefined && { area: data.area }),
        ...(data.amenities !== undefined && { amenities: data.amenities }),
        ...(data.petFriendly !== undefined && { petFriendly: data.petFriendly }),
        ...(data.furnished !== undefined && { furnished: data.furnished }),
        ...(data.minNights !== undefined && { minNights: data.minNights }),
        ...(data.maxGuests !== undefined && { maxGuests: data.maxGuests }),
        ...(data.checkInTime !== undefined && { checkInTime: data.checkInTime }),
        ...(data.checkOutTime !== undefined && { checkOutTime: data.checkOutTime }),
        ...(data.houseRules !== undefined && { houseRules: data.houseRules }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.blockedDates !== undefined && { blockedDates: data.blockedDates }),
      },
    });
    return this.toDomain(property);
  }

  async updateStatus(id: string, status: PropertyStatus): Promise<Property> {
    const property = await this.prisma.property.update({
      where: { id },
      data: { status },
    });
    return this.toDomain(property);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.property.delete({ where: { id } });
  }

  async hasConflictingBooking(propertyId: string, checkIn: Date, checkOut: Date): Promise<boolean> {
    const count = await this.prisma.booking.count({
      where: {
        propertyId,
        status: { in: ['PENDENTE', 'CONFIRMADA'] },
        OR: [
          {
            checkIn: { lte: checkOut },
            checkOut: { gte: checkIn },
          },
        ],
      },
    });
    return count > 0;
  }

  // Image methods
  async findImagesByPropertyId(propertyId: string): Promise<PropertyImage[]> {
    return this.prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findImageById(imageId: string, propertyId: string): Promise<PropertyImage | null> {
    return this.prisma.propertyImage.findFirst({
      where: {
        id: imageId,
        propertyId,
      },
    });
  }

  async createImage(data: {
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
  }): Promise<PropertyImage> {
    return this.prisma.propertyImage.create({
      data: {
        propertyId: data.propertyId,
        publicId: data.publicId,
        url: data.url,
        secureUrl: data.secureUrl,
        format: data.format,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
        displayOrder: data.displayOrder || 0,
        isPrimary: data.isPrimary || false,
      },
    });
  }

  async deleteImage(imageId: string): Promise<void> {
    await this.prisma.propertyImage.delete({ where: { id: imageId } });
  }

  async clearImagePrimary(propertyId: string): Promise<void> {
    await this.prisma.propertyImage.updateMany({
      where: { propertyId },
      data: { isPrimary: false },
    });
  }

  async setImagePrimary(imageId: string): Promise<PropertyImage> {
    return this.prisma.propertyImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }
}
