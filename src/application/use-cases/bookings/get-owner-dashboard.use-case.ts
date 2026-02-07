import { Booking, BookingStatus } from '../../../domain/entities/booking';
import { BookingRepository } from '../../ports/booking-repository';
import { PropertyRepository } from '../../ports/property-repository';

export interface OwnerDashboard {
  totalProperties: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  totalRevenue: number;
  recentBookings: Booking[];
}

export interface GetOwnerDashboardInput {
  ownerId: string;
}

export class GetOwnerDashboardUseCase {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly propertyRepository: PropertyRepository,
  ) { }

  async execute(input: GetOwnerDashboardInput): Promise<OwnerDashboard> {
    // Fetch all stats in parallel for better performance
    const [
      totalProperties,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      totalRevenue,
      recentBookings,
    ] = await Promise.all([
      this.propertyRepository.countByOwner(input.ownerId),
      this.bookingRepository.countByOwnerAndStatus(input.ownerId, BookingStatus.PENDENTE),
      this.bookingRepository.countByOwnerAndStatus(input.ownerId, BookingStatus.CONFIRMADA),
      this.bookingRepository.countByOwnerAndStatus(input.ownerId, BookingStatus.CONCLUIDA),
      this.bookingRepository.sumRevenueByOwner(input.ownerId),
      this.bookingRepository.findRecentByOwner(input.ownerId, 5),
    ]);

    return {
      totalProperties,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      totalRevenue,
      recentBookings,
    };
  }
}
