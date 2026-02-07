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

export interface CancelBookingInput {
  bookingId: string;
  userId: string;
  reason?: string;
}

export class CancelBookingUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly activityRepository?: ActivityRepository,
  ) { }

  async execute(input: CancelBookingInput): Promise<Booking> {
    // 1. Find booking
    const booking = await this.bookingRepository.findById(input.bookingId);
    if (!booking) {
      throw new BookingNotFoundError(input.bookingId);
    }

    // 2. Verify authorization (must be guest or owner)
    const isGuest = booking.guestId === input.userId;
    const isOwner = booking.ownerId === input.userId;

    if (!isGuest && !isOwner) {
      throw new NotAuthorizedError('Only the guest or owner can cancel this booking');
    }

    // 3. Validate status transition
    if (booking.status === BookingStatus.CANCELADA || booking.status === BookingStatus.CONCLUIDA) {
      throw new InvalidStatusTransitionError(booking.status, BookingStatus.CANCELADA);
    }

    // 4. Update status
    const cancelledBooking = await this.bookingRepository.updateStatus(
      input.bookingId,
      BookingStatus.CANCELADA,
    );

    // 5. Create activity (notify guest)
    if (this.activityRepository) {
      const description = input.reason
        ? `Reserva cancelada: ${input.reason}`
        : 'Reserva cancelada';

      await this.activityRepository.create({
        userId: booking.guestId, // Always notify the guest
        type: 'RESERVA_CANCELADA',
        title: 'Reserva cancelada',
        description,
        propertyId: booking.propertyId,
        bookingId: booking.id,
      });
    }

    return cancelledBooking;
  }
}
