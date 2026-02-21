import { GetOwnerDashboardUseCase, OwnerDashboard } from './get-owner-dashboard.use-case';
import { Booking, BookingStatus } from '../../../domain/entities/booking';
import { Property, PropertyStatus, PropertyType } from '../../../domain/entities/property';
import { BookingRepository, CreateBookingData } from '../../ports/booking-repository';
import { PropertyRepository, PropertyFilters, CreatePropertyData, UpdatePropertyData } from '../../ports/property-repository';

// In-memory repositories for testing
class InMemoryBookingRepository implements BookingRepository {
  private bookings: Booking[] = [];

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.find((b) => b.id === id) || null;
  }

  async findByGuest(guestId: string): Promise<Booking[]> {
    return this.bookings.filter((b) => b.guestId === guestId);
  }

  async findByOwner(ownerId: string): Promise<Booking[]> {
    return this.bookings.filter((b) => b.ownerId === ownerId);
  }

  async findRecentByOwner(ownerId: string, limit: number): Promise<Booking[]> {
    return this.bookings
      .filter((b) => b.ownerId === ownerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async countByOwnerAndStatus(ownerId: string, status: BookingStatus): Promise<number> {
    return this.bookings.filter((b) => b.ownerId === ownerId && b.status === status).length;
  }

  async sumRevenueByOwner(ownerId: string): Promise<number> {
    return this.bookings
      .filter((b) => b.ownerId === ownerId && b.status === BookingStatus.CONCLUIDA)
      .reduce((sum, b) => sum + b.totalPrice, 0);
  }

  async hasConflictingBooking(): Promise<boolean> {
    return false;
  }

  async create(data: CreateBookingData): Promise<Booking> {
    throw new Error('Not implemented');
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    throw new Error('Not implemented');
  }

  addBooking(booking: Booking): void {
    this.bookings.push(booking);
  }
}

class InMemoryPropertyRepository implements PropertyRepository {
  private properties: Property[] = [];

  async findById(id: string): Promise<Property | null> {
    return this.properties.find((p) => p.id === id) || null;
  }

  async findAll(filters?: PropertyFilters): Promise<Property[]> {
    return this.properties;
  }

  async findByOwner(ownerId: string): Promise<Property[]> {
    return this.properties.filter((p) => p.ownerId === ownerId);
  }

  async countByOwner(ownerId: string): Promise<number> {
    return this.properties.filter((p) => p.ownerId === ownerId).length;
  }

  async create(data: CreatePropertyData): Promise<Property> {
    throw new Error('Not implemented');
  }

  async update(id: string, data: UpdatePropertyData): Promise<Property> {
    throw new Error('Not implemented');
  }

  async updateStatus(id: string, status: PropertyStatus): Promise<Property> {
    throw new Error('Not implemented');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async hasConflictingBooking(): Promise<boolean> {
    return false;
  }

  // Image methods - required by interface
  async findImagesByPropertyId(propertyId: string): Promise<any[]> {
    return [];
  }

  async findImageById(imageId: string, propertyId: string): Promise<any | null> {
    return null;
  }

  async createImage(data: any): Promise<any> {
    return { id: 'image-1', ...data };
  }

  async deleteImage(imageId: string): Promise<void> {
    // noop for tests
  }

  async clearImagePrimary(propertyId: string): Promise<void> {
    // noop for tests
  }

  async setImagePrimary(imageId: string): Promise<any> {
    return { id: imageId, isPrimary: true };
  }

  addProperty(property: Property): void {
    this.properties.push(property);
  }
}

describe('GetOwnerDashboardUseCase', () => {
  let useCase: GetOwnerDashboardUseCase;
  let bookingRepository: InMemoryBookingRepository;
  let propertyRepository: InMemoryPropertyRepository;

  beforeEach(() => {
    bookingRepository = new InMemoryBookingRepository();
    propertyRepository = new InMemoryPropertyRepository();
    useCase = new GetOwnerDashboardUseCase(bookingRepository, propertyRepository);
  });

  const createProperty = (id: string, ownerId: string = 'owner-1'): Property => {
    return new Property({
      id,
      ownerId,
      title: `Property ${id}`,
      type: PropertyType.TEMPORADA,
      status: PropertyStatus.ATIVO,
      pricePerNight: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const createBooking = (id: string, status: BookingStatus, ownerId: string = 'owner-1'): Booking => {
    return new Booking({
      id,
      propertyId: 'property-1',
      guestId: 'guest-1',
      ownerId,
      checkIn: new Date('2025-03-01'),
      checkOut: new Date('2025-03-05'),
      guests: 3,
      adults: 2,
      children: 1,
      totalNights: 4,
      pricePerNight: 500,
      cleaningFee: 150,
      serviceFee: 200,
      totalPrice: 2350,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  describe('Dashboard Statistics', () => {
    it('should return dashboard with all stats', async () => {
      // Setup properties
      propertyRepository.addProperty(createProperty('p1'));
      propertyRepository.addProperty(createProperty('p2'));
      propertyRepository.addProperty(createProperty('p3'));

      // Setup bookings
      bookingRepository.addBooking(createBooking('b1', BookingStatus.PENDENTE));
      bookingRepository.addBooking(createBooking('b2', BookingStatus.PENDENTE));
      bookingRepository.addBooking(createBooking('b3', BookingStatus.CONFIRMADA));
      bookingRepository.addBooking(createBooking('b4', BookingStatus.CONCLUIDA));
      bookingRepository.addBooking(createBooking('b5', BookingStatus.CONCLUIDA));

      const dashboard = await useCase.execute({ ownerId: 'owner-1' });

      expect(dashboard).toEqual<OwnerDashboard>({
        totalProperties: 3,
        pendingBookings: 2,
        confirmedBookings: 1,
        completedBookings: 2,
        totalRevenue: 4700, // 2 x 2350
        recentBookings: expect.any(Array),
      });
    });

    it('should return empty dashboard for owner with no data', async () => {
      const dashboard = await useCase.execute({ ownerId: 'empty-owner' });

      expect(dashboard).toEqual<OwnerDashboard>({
        totalProperties: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        recentBookings: [],
      });
    });

    it('should return recent bookings (max 5)', async () => {
      // Add 7 bookings
      for (let i = 1; i <= 7; i++) {
        const booking = new Booking({
          id: `booking-${i}`,
          propertyId: 'property-1',
          guestId: 'guest-1',
          ownerId: 'owner-1',
          checkIn: new Date('2025-03-01'),
          checkOut: new Date('2025-03-05'),
          guests: 3,
          adults: 2,
          children: 1,
          totalNights: 4,
          pricePerNight: 500,
          cleaningFee: 150,
          serviceFee: 200,
          totalPrice: 2350,
          status: BookingStatus.PENDENTE,
          createdAt: new Date(Date.now() - i * 1000), // Older as i increases
          updatedAt: new Date(),
        });
        bookingRepository.addBooking(booking);
      }

      const dashboard = await useCase.execute({ ownerId: 'owner-1' });

      expect(dashboard.recentBookings).toHaveLength(5);
      // Should be most recent first
      expect(dashboard.recentBookings[0].id).toBe('booking-1');
    });

    it('should only count bookings from the specific owner', async () => {
      // Owner 1 bookings
      bookingRepository.addBooking(createBooking('b1', BookingStatus.CONCLUIDA, 'owner-1'));

      // Owner 2 bookings
      bookingRepository.addBooking(createBooking('b2', BookingStatus.CONCLUIDA, 'owner-2'));
      bookingRepository.addBooking(createBooking('b3', BookingStatus.CONCLUIDA, 'owner-2'));

      const dashboard = await useCase.execute({ ownerId: 'owner-1' });

      expect(dashboard.completedBookings).toBe(1);
      expect(dashboard.totalRevenue).toBe(2350);
    });
  });
});
