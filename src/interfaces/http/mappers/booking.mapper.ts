import { Booking } from '../../../domain/entities/booking';
import { BookingResponseDto } from '../dto/booking.dto';

export class BookingMapper {
  static toResponseDto(booking: Booking): BookingResponseDto {
    return {
      id: booking.id,
      propertyId: booking.propertyId,
      guestId: booking.guestId,
      ownerId: booking.ownerId,
      checkIn: booking.checkIn instanceof Date ? booking.checkIn.toISOString() : String(booking.checkIn),
      checkOut: booking.checkOut instanceof Date ? booking.checkOut.toISOString() : String(booking.checkOut),
      guests: booking.guests,
      adults: booking.adults,
      children: booking.children,
      totalNights: booking.totalNights,
      pricePerNight: booking.pricePerNight,
      cleaningFee: booking.cleaningFee,
      serviceFee: booking.serviceFee,
      totalPrice: booking.totalPrice,
      status: booking.status,
      message: booking.message,
      createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : String(booking.createdAt),
      updatedAt: booking.updatedAt instanceof Date ? booking.updatedAt.toISOString() : String(booking.updatedAt),
    };
  }
}
