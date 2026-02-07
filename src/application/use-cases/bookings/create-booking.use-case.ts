import { Booking, BookingStatus } from '../../../domain/entities/booking';
import { BookingRepository } from '../../ports/booking-repository';
import { PropertyRepository } from '../../ports/property-repository';
import { ActivityRepository } from '../../ports/activity-repository';

export class PropertyNotFoundError extends Error {
  constructor(propertyId: string) {
    super(`Property not found: ${propertyId}`);
    this.name = 'PropertyNotFoundError';
  }
}

export class PropertyNotAvailableError extends Error {
  constructor(propertyId: string) {
    super(`Property is not available for booking: ${propertyId}`);
    this.name = 'PropertyNotAvailableError';
  }
}

export class MinNightsRequiredError extends Error {
  constructor(minNights: number) {
    super(`Minimum ${minNights} nights required`);
    this.name = 'MinNightsRequiredError';
  }
}

export class MaxGuestsExceededError extends Error {
  constructor(maxGuests: number) {
    super(`Maximum ${maxGuests} guests allowed`);
    this.name = 'MaxGuestsExceededError';
  }
}

export class DatesUnavailableError extends Error {
  constructor(checkIn: string, checkOut: string) {
    super(`Dates unavailable: ${checkIn} to ${checkOut}`);
    this.name = 'DatesUnavailableError';
  }
}

export interface CreateBookingInput {
  propertyId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  message?: string;
}

export class CreateBookingUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly activityRepository?: ActivityRepository,
  ) { }

  async execute(input: CreateBookingInput): Promise<Booking> {
    // 1. Find property
    const property = await this.propertyRepository.findById(input.propertyId);
    if (!property) {
      throw new PropertyNotFoundError(input.propertyId);
    }

    // 2. Validate property is available
    if (!property.isAvailableForBooking()) {
      throw new PropertyNotAvailableError(input.propertyId);
    }

    // 3. Parse and validate dates
    const checkIn = new Date(input.checkIn);
    const checkOut = new Date(input.checkOut);
    const totalNights = this.calculateNights(checkIn, checkOut);

    // 4. Validate minimum nights
    if (property.minNights && totalNights < property.minNights) {
      throw new MinNightsRequiredError(property.minNights);
    }

    // 5. Validate max guests
    const totalGuests = input.adults + input.children;
    if (property.maxGuests && totalGuests > property.maxGuests) {
      throw new MaxGuestsExceededError(property.maxGuests);
    }

    // 6. Check for conflicting bookings
    const hasConflict = await this.bookingRepository.hasConflictingBooking(
      input.propertyId,
      checkIn,
      checkOut,
    );
    if (hasConflict) {
      throw new DatesUnavailableError(input.checkIn, input.checkOut);
    }

    // 7. Calculate prices
    const pricePerNight = property.pricePerNight || 0;
    const { cleaningFee, serviceFee, total } = Booking.calculatePrice(pricePerNight, totalNights);

    // 8. Create booking
    const booking = await this.bookingRepository.create({
      propertyId: input.propertyId,
      guestId: input.guestId,
      ownerId: property.ownerId,
      checkIn,
      checkOut,
      guests: totalGuests,
      adults: input.adults,
      children: input.children,
      totalNights,
      pricePerNight,
      cleaningFee,
      serviceFee,
      totalPrice: total,
      message: input.message,
    });

    // 9. Create activity
    if (this.activityRepository) {
      await this.activityRepository.create({
        userId: input.guestId,
        type: 'RESERVA_CRIADA',
        title: 'Reserva solicitada',
        description: `${property.title} - ${input.checkIn} a ${input.checkOut}`,
        propertyId: input.propertyId,
        bookingId: booking.id,
      });
    }

    return booking;
  }

  private calculateNights(checkIn: Date, checkOut: Date): number {
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
