import {
  CancelBookingUseCase,
  BookingNotFoundError,
  NotAuthorizedError,
  InvalidStatusTransitionError,
} from './cancel-booking.use-case';
import { Booking, BookingStatus } from '../../../domain/entities/booking';
import { BookingRepository, CreateBookingData } from '../../ports/booking-repository';
import { ActivityRepository, CreateActivityData } from '../../ports/activity-repository';

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
    const booking = await this.findById(id);
    if (!booking) throw new Error('Booking not found');

    let updated: Booking;
    switch (status) {
      case BookingStatus.CONFIRMADA:
        updated = booking.confirm();
        break;
      case BookingStatus.CANCELADA:
        updated = booking.cancel();
        break;
      case BookingStatus.CONCLUIDA:
        updated = booking.complete();
        break;
      default:
        throw new Error('Invalid status transition');
    }

    const index = this.bookings.findIndex((b) => b.id === id);
    this.bookings[index] = updated;
    return updated;
  }

  // Helper for tests
  addBooking(booking: Booking): void {
    this.bookings.push(booking);
  }
}

class InMemoryActivityRepository implements ActivityRepository {
  private activities: any[] = [];

  async create(data: CreateActivityData): Promise<any> {
    const activity = { id: `activity-${this.activities.length + 1}`, ...data, createdAt: new Date() };
    this.activities.push(activity);
    return activity;
  }

  async findByUser(userId: string): Promise<any[]> {
    return this.activities.filter((a) => a.userId === userId);
  }

  getActivities(): any[] {
    return this.activities;
  }
}

describe('CancelBookingUseCase', () => {
  let useCase: CancelBookingUseCase;
  let bookingRepository: InMemoryBookingRepository;
  let activityRepository: InMemoryActivityRepository;

  beforeEach(() => {
    bookingRepository = new InMemoryBookingRepository();
    activityRepository = new InMemoryActivityRepository();
    useCase = new CancelBookingUseCase(bookingRepository, activityRepository);
  });

  const createBooking = (overrides: Partial<Booking> = {}): Booking => {
    return new Booking({
      id: 'booking-1',
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

  describe('Guest Cancellation', () => {
    it('should allow guest to cancel their pending booking', async () => {
      const booking = createBooking();
      bookingRepository.addBooking(booking);

      const result = await useCase.execute({
        bookingId: 'booking-1',
        userId: 'guest-1',
        reason: 'Changed plans',
      });

      expect(result.status).toBe(BookingStatus.CANCELADA);
    });

    it('should allow guest to cancel their confirmed booking', async () => {
      const confirmedBooking = createBooking({
        id: 'confirmed-booking',
        status: BookingStatus.CONFIRMADA,
      });
      bookingRepository.addBooking(confirmedBooking);

      const result = await useCase.execute({
        bookingId: 'confirmed-booking',
        userId: 'guest-1',
        reason: 'Emergency',
      });

      expect(result.status).toBe(BookingStatus.CANCELADA);
    });

    it('should create activity for guest cancellation', async () => {
      const booking = createBooking();
      bookingRepository.addBooking(booking);

      await useCase.execute({
        bookingId: 'booking-1',
        userId: 'guest-1',
        reason: 'Changed plans',
      });

      const activities = activityRepository.getActivities();
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('RESERVA_CANCELADA');
      expect(activities[0].userId).toBe('guest-1');
    });
  });

  describe('Owner Cancellation', () => {
    it('should allow owner to cancel a pending booking', async () => {
      const booking = createBooking();
      bookingRepository.addBooking(booking);

      const result = await useCase.execute({
        bookingId: 'booking-1',
        userId: 'owner-1',
        reason: 'Property unavailable',
      });

      expect(result.status).toBe(BookingStatus.CANCELADA);
    });

    it('should allow owner to cancel a confirmed booking', async () => {
      const confirmedBooking = createBooking({
        id: 'confirmed-booking',
        status: BookingStatus.CONFIRMADA,
      });
      bookingRepository.addBooking(confirmedBooking);

      const result = await useCase.execute({
        bookingId: 'confirmed-booking',
        userId: 'owner-1',
        reason: 'Maintenance required',
      });

      expect(result.status).toBe(BookingStatus.CANCELADA);
    });

    it('should create activity notifying guest when owner cancels', async () => {
      const booking = createBooking();
      bookingRepository.addBooking(booking);

      await useCase.execute({
        bookingId: 'booking-1',
        userId: 'owner-1',
        reason: 'Property unavailable',
      });

      const activities = activityRepository.getActivities();
      expect(activities).toHaveLength(1);
      expect(activities[0].userId).toBe('guest-1'); // Notify guest
      expect(activities[0].type).toBe('RESERVA_CANCELADA');
    });
  });

  describe('Error Cases', () => {
    it('should throw BookingNotFoundError if booking does not exist', async () => {
      await expect(
        useCase.execute({
          bookingId: 'non-existent',
          userId: 'guest-1',
        }),
      ).rejects.toThrow(BookingNotFoundError);
    });

    it('should throw NotAuthorizedError if user is neither guest nor owner', async () => {
      const booking = createBooking();
      bookingRepository.addBooking(booking);

      await expect(
        useCase.execute({
          bookingId: 'booking-1',
          userId: 'random-user',
        }),
      ).rejects.toThrow(NotAuthorizedError);
    });

    it('should throw InvalidStatusTransitionError if booking is already cancelled', async () => {
      const cancelledBooking = createBooking({
        id: 'cancelled-booking',
        status: BookingStatus.CANCELADA,
      });
      bookingRepository.addBooking(cancelledBooking);

      await expect(
        useCase.execute({
          bookingId: 'cancelled-booking',
          userId: 'guest-1',
        }),
      ).rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should throw InvalidStatusTransitionError if booking is completed', async () => {
      const completedBooking = createBooking({
        id: 'completed-booking',
        status: BookingStatus.CONCLUIDA,
      });
      bookingRepository.addBooking(completedBooking);

      await expect(
        useCase.execute({
          bookingId: 'completed-booking',
          userId: 'guest-1',
        }),
      ).rejects.toThrow(InvalidStatusTransitionError);
    });
  });

  describe('Without Activity Repository', () => {
    it('should work without activity repository', async () => {
      const useCaseNoActivity = new CancelBookingUseCase(bookingRepository);
      const booking = createBooking();
      bookingRepository.addBooking(booking);

      const result = await useCaseNoActivity.execute({
        bookingId: 'booking-1',
        userId: 'guest-1',
      });

      expect(result.status).toBe(BookingStatus.CANCELADA);
    });
  });
});
