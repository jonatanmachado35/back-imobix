import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { BOOKING_REPOSITORY, ACTIVITY_REPOSITORY } from './bookings.tokens';
import { PROPERTY_REPOSITORY } from '../properties/properties.tokens';
import { PrismaBookingRepository } from '../infrastructure/database/prisma-booking.repository';
import { PrismaPropertyRepository } from '../infrastructure/database/prisma-property.repository';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { BookingRepository } from '../application/ports/booking-repository';
import { PropertyRepository } from '../application/ports/property-repository';
import { ActivityRepository } from '../application/ports/activity-repository';
import { CreateBookingUseCase } from '../application/use-cases/bookings/create-booking.use-case';
import { ConfirmBookingUseCase } from '../application/use-cases/bookings/confirm-booking.use-case';
import { CancelBookingUseCase } from '../application/use-cases/bookings/cancel-booking.use-case';
import { ListBookingsUseCase } from '../application/use-cases/bookings/list-bookings.use-case';
import { GetOwnerDashboardUseCase } from '../application/use-cases/bookings/get-owner-dashboard.use-case';
import { BookingsController } from '../interfaces/http/bookings.controller';
import { OwnerBookingsController } from '../interfaces/http/owner-bookings.controller';

// Placeholder for ActivityRepository - will be implemented in Sprint 3
class InMemoryActivityRepository implements ActivityRepository {
  async findByUser(): Promise<any[]> {
    return [];
  }
  async create(data: any): Promise<any> {
    return { id: 'temp', ...data };
  }
}

@Module({
  imports: [DatabaseModule],
  controllers: [BookingsController, OwnerBookingsController],
  providers: [
    PrismaService,
    { provide: BOOKING_REPOSITORY, useClass: PrismaBookingRepository },
    { provide: PROPERTY_REPOSITORY, useClass: PrismaPropertyRepository },
    { provide: ACTIVITY_REPOSITORY, useClass: InMemoryActivityRepository },
    {
      provide: CreateBookingUseCase,
      useFactory: (
        bookingRepo: BookingRepository,
        propertyRepo: PropertyRepository,
        activityRepo: ActivityRepository,
      ) => new CreateBookingUseCase(bookingRepo, propertyRepo, activityRepo),
      inject: [BOOKING_REPOSITORY, PROPERTY_REPOSITORY, ACTIVITY_REPOSITORY],
    },
    {
      provide: ConfirmBookingUseCase,
      useFactory: (bookingRepo: BookingRepository, activityRepo: ActivityRepository) =>
        new ConfirmBookingUseCase(bookingRepo, activityRepo),
      inject: [BOOKING_REPOSITORY, ACTIVITY_REPOSITORY],
    },
    {
      provide: CancelBookingUseCase,
      useFactory: (bookingRepo: BookingRepository, activityRepo: ActivityRepository) =>
        new CancelBookingUseCase(bookingRepo, activityRepo),
      inject: [BOOKING_REPOSITORY, ACTIVITY_REPOSITORY],
    },
    {
      provide: ListBookingsUseCase,
      useFactory: (bookingRepo: BookingRepository) => new ListBookingsUseCase(bookingRepo),
      inject: [BOOKING_REPOSITORY],
    },
    {
      provide: GetOwnerDashboardUseCase,
      useFactory: (bookingRepo: BookingRepository, propertyRepo: PropertyRepository) =>
        new GetOwnerDashboardUseCase(bookingRepo, propertyRepo),
      inject: [BOOKING_REPOSITORY, PROPERTY_REPOSITORY],
    },
  ],
  exports: [BOOKING_REPOSITORY, ACTIVITY_REPOSITORY],
})
export class BookingsModule { }
