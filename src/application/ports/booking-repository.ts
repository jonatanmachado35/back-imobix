import { Booking } from '../../domain/entities/booking';

export type CreateBookingData = {
  propertyId: string;
  guestId: string;
  ownerId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  adults: number;
  children: number;
  totalNights: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  totalPrice: number;
  message?: string;
};

export type BookingFilters = {
  guestId?: string;
  ownerId?: string;
  propertyId?: string;
  status?: string;
};

export interface BookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByGuest(guestId: string): Promise<Booking[]>;
  findByOwner(ownerId: string): Promise<Booking[]>;
  findRecentByOwner(ownerId: string, limit: number): Promise<Booking[]>;
  countByOwnerAndStatus(ownerId: string, status: string): Promise<number>;
  sumRevenueByOwner(ownerId: string): Promise<number>;
  hasConflictingBooking(propertyId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string): Promise<boolean>;
  create(data: CreateBookingData): Promise<Booking>;
  updateStatus(id: string, status: string): Promise<Booking>;
}
