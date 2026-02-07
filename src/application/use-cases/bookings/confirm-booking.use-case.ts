import { Booking, BookingStatus } from '../../../domain/entities/booking';
import { BookingRepository } from '../../ports/booking-repository';
import { ActivityRepository } from '../../ports/activity-repository';

export class BookingNotFoundError extends Error {
  constructor(bookingId: string) {
    super(`Booking not found: ${bookingId}`);
    this.name = 'BookingNotFoundError';
  }
}

export class NotAuthorizedError extends Error {
  constructor(message: string = 'Not authorized to perform this action') {
    super(message);
    this.name = 'NotAuthorizedError';
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(from: BookingStatus, to: BookingStatus) {
    super(`Cannot transition from ${from} to ${to}`);
    this.name = 'InvalidStatusTransitionError';
  }
}

export interface ConfirmBookingInput {
  bookingId: string;
  ownerId: string;
}

export class ConfirmBookingUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly activityRepository?: ActivityRepository,
  ) { }

  async execute(input: ConfirmBookingInput): Promise<Booking> {
    // 1. Find booking
    const booking = await this.bookingRepository.findById(input.bookingId);
    if (!booking) {
      throw new BookingNotFoundError(input.bookingId);
    }

    // 2. Verify owner authorization
    if (booking.ownerId !== input.ownerId) {
      throw new NotAuthorizedError('Only the property owner can confirm bookings');
    }

    // 3. Validate status transition
    if (booking.status !== BookingStatus.PENDENTE) {
      throw new InvalidStatusTransitionError(booking.status, BookingStatus.CONFIRMADA);
    }

    // 4. Update status
    const confirmedBooking = await this.bookingRepository.updateStatus(
      input.bookingId,
      BookingStatus.CONFIRMADA,
    );

    // 5. Create activity
    if (this.activityRepository) {
      await this.activityRepository.create({
        userId: booking.guestId,
        type: 'RESERVA_CONFIRMADA',
        title: 'Reserva confirmada',
        description: `Sua reserva foi confirmada pelo proprietário`,
        propertyId: booking.propertyId,
        bookingId: booking.id,
      });
    }

    return confirmedBooking;
  }
}
