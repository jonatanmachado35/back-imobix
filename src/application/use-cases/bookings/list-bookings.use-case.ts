import { Booking } from '../../../domain/entities/booking';
import { BookingRepository } from '../../ports/booking-repository';

export interface ListBookingsInput {
  userId: string;
  role: 'guest' | 'owner';
}

export interface RecentBookingsInput {
  ownerId: string;
  limit: number;
}

export class ListBookingsUseCase {
  constructor(private readonly bookingRepository: BookingRepository) { }

  async execute(input: ListBookingsInput): Promise<Booking[]> {
    if (input.role === 'guest') {
      return this.bookingRepository.findByGuest(input.userId);
    } else {
      return this.bookingRepository.findByOwner(input.userId);
    }
  }

  async executeRecent(input: RecentBookingsInput): Promise<Booking[]> {
    return this.bookingRepository.findRecentByOwner(input.ownerId, input.limit);
  }
}
