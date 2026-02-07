import {
  ConfirmBookingUseCase,
  BookingNotFoundError,
  NotAuthorizedError,
  InvalidStatusTransitionError,
} from './confirm-booking.use-case';
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

describe('ConfirmBookingUseCase', () => {
  let useCase: ConfirmBookingUseCase;
  let bookingRepository: InMemoryBookingRepository;
  let activityRepository: InMemoryActivityRepository;
  let pendingBooking: Booking;

  beforeEach(() => {
    bookingRepository = new InMemoryBookingRepository();
    activityRepository = new InMemoryActivityRepository();
    useCase = new ConfirmBookingUseCase(bookingRepository, activityRepository);

    // Create pending booking for tests
    pendingBooking = new Booking({
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
    });
    bookingRepository.addBooking(pendingBooking);
  });

  describe('Happy Path', () => {
    it('should confirm a pending booking', async () => {
      const booking = await useCase.execute({
        bookingId: 'booking-1',
        ownerId: 'owner-1',
      });

      expect(booking.status).toBe(BookingStatus.CONFIRMADA);
    });

    it('should create activity for confirmation', async () => {
      await useCase.execute({
        bookingId: 'booking-1',
        ownerId: 'owner-1',
      });

      const activities = activityRepository.getActivities();
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('RESERVA_CONFIRMADA');
      expect(activities[0].userId).toBe('guest-1');
    });

    it('should work without activity repository', async () => {
      const useCaseNoActivity = new ConfirmBookingUseCase(bookingRepository);

      const booking = await useCaseNoActivity.execute({
        bookingId: 'booking-1',
        ownerId: 'owner-1',
      });

      expect(booking.status).toBe(BookingStatus.CONFIRMADA);
    });
  });

  describe('Error Cases', () => {
    it('should throw BookingNotFoundError if booking does not exist', async () => {
      await expect(
        useCase.execute({
          bookingId: 'non-existent',
          ownerId: 'owner-1',
        }),
      ).rejects.toThrow(BookingNotFoundError);
    });

    it('should throw NotAuthorizedError if user is not the owner', async () => {
      await expect(
        useCase.execute({
          bookingId: 'booking-1',
          ownerId: 'other-owner',
        }),
      ).rejects.toThrow(NotAuthorizedError);
    });

    it('should throw InvalidStatusTransitionError if booking is already confirmed', async () => {
      // First confirm it
      await useCase.execute({
        bookingId: 'booking-1',
        ownerId: 'owner-1',
      });

      // Try to confirm again
      await expect(
        useCase.execute({
          bookingId: 'booking-1',
          ownerId: 'owner-1',
        }),
      ).rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should throw InvalidStatusTransitionError if booking is cancelled', async () => {
      // Add a cancelled booking
      const cancelledBooking = new Booking({
        id: 'cancelled-booking',
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
        status: BookingStatus.CANCELADA,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      bookingRepository.addBooking(cancelledBooking);

      await expect(
        useCase.execute({
          bookingId: 'cancelled-booking',
          ownerId: 'owner-1',
        }),
      ).rejects.toThrow(InvalidStatusTransitionError);
    });
  });
});
