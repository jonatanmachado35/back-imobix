import { ListBookingsUseCase, ListBookingsInput } from './list-bookings.use-case';
import { Booking, BookingStatus } from '../../../domain/entities/booking';
import { BookingRepository, CreateBookingData } from '../../ports/booking-repository';

// In-memory repository for testing
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

  async hasConflictingBooking(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string,
  ): Promise<boolean> {
    return false;
  }

  async create(data: CreateBookingData): Promise<Booking> {
    throw new Error('Not implemented');
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    throw new Error('Not implemented');
  }

  // Helper for tests
  addBooking(booking: Booking): void {
    this.bookings.push(booking);
  }
}

describe('ListBookingsUseCase', () => {
  let useCase: ListBookingsUseCase;
  let bookingRepository: InMemoryBookingRepository;

  beforeEach(() => {
    bookingRepository = new InMemoryBookingRepository();
    useCase = new ListBookingsUseCase(bookingRepository);
  });

  const createBooking = (id: string, overrides: Partial<any> = {}): Booking => {
    return new Booking({
      id,
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
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  };

  describe('List by Guest', () => {
    it('should return all bookings for a guest', async () => {
      bookingRepository.addBooking(createBooking('booking-1', { guestId: 'guest-1' }));
      bookingRepository.addBooking(createBooking('booking-2', { guestId: 'guest-1' }));
      bookingRepository.addBooking(createBooking('booking-3', { guestId: 'guest-2' }));

      const result = await useCase.execute({
        userId: 'guest-1',
        role: 'guest',
      });

      expect(result).toHaveLength(2);
      expect(result.every((b) => b.guestId === 'guest-1')).toBe(true);
    });

    it('should return empty array if guest has no bookings', async () => {
      const result = await useCase.execute({
        userId: 'guest-without-bookings',
        role: 'guest',
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('List by Owner', () => {
    it('should return all bookings for property owner', async () => {
      bookingRepository.addBooking(createBooking('booking-1', { ownerId: 'owner-1' }));
      bookingRepository.addBooking(createBooking('booking-2', { ownerId: 'owner-1' }));
      bookingRepository.addBooking(createBooking('booking-3', { ownerId: 'owner-2' }));

      const result = await useCase.execute({
        userId: 'owner-1',
        role: 'owner',
      });

      expect(result).toHaveLength(2);
      expect(result.every((b) => b.ownerId === 'owner-1')).toBe(true);
    });

    it('should return empty array if owner has no bookings', async () => {
      const result = await useCase.execute({
        userId: 'owner-without-bookings',
        role: 'owner',
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('Recent Bookings for Dashboard', () => {
    it('should return recent bookings with limit for owner dashboard', async () => {
      const now = new Date();
      bookingRepository.addBooking(createBooking('booking-1', {
        ownerId: 'owner-1',
        createdAt: new Date(now.getTime() - 3000),
      }));
      bookingRepository.addBooking(createBooking('booking-2', {
        ownerId: 'owner-1',
        createdAt: new Date(now.getTime() - 2000),
      }));
      bookingRepository.addBooking(createBooking('booking-3', {
        ownerId: 'owner-1',
        createdAt: new Date(now.getTime() - 1000),
      }));

      const result = await useCase.executeRecent({
        ownerId: 'owner-1',
        limit: 2,
      });

      expect(result).toHaveLength(2);
      // Should be sorted by most recent first
      expect(result[0].id).toBe('booking-3');
      expect(result[1].id).toBe('booking-2');
    });
  });
});
