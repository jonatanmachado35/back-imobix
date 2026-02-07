import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Booking, BookingStatus } from '../../domain/entities/booking';
import {
  BookingRepository,
  CreateBookingData,
} from '../../application/ports/booking-repository';
import { Booking as PrismaBooking, BookingStatus as PrismaBookingStatus } from '@prisma/client';

@Injectable()
export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaService) { }

  private toDomain(prismaBooking: PrismaBooking): Booking {
    return new Booking({
      id: prismaBooking.id,
      propertyId: prismaBooking.propertyId,
      guestId: prismaBooking.guestId,
      ownerId: prismaBooking.ownerId,
      checkIn: prismaBooking.checkIn,
      checkOut: prismaBooking.checkOut,
      guests: prismaBooking.guests,
      adults: prismaBooking.adults,
      children: prismaBooking.children,
      totalNights: prismaBooking.totalNights,
      pricePerNight: prismaBooking.pricePerNight.toNumber(),
      cleaningFee: prismaBooking.cleaningFee.toNumber(),
      serviceFee: prismaBooking.serviceFee.toNumber(),
      totalPrice: prismaBooking.totalPrice.toNumber(),
      status: prismaBooking.status as BookingStatus,
      message: prismaBooking.message ?? undefined,
      createdAt: prismaBooking.createdAt,
      updatedAt: prismaBooking.updatedAt,
    });
  }

  async findById(id: string): Promise<Booking | null> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });
    return booking ? this.toDomain(booking) : null;
  }

  async findByGuest(guestId: string): Promise<Booking[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { guestId },
      orderBy: { createdAt: 'desc' },
    });
    return bookings.map((b) => this.toDomain(b));
  }

  async findByOwner(ownerId: string): Promise<Booking[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
    return bookings.map((b) => this.toDomain(b));
  }

  async findRecentByOwner(ownerId: string, limit: number): Promise<Booking[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return bookings.map((b) => this.toDomain(b));
  }

  async countByOwnerAndStatus(ownerId: string, status: BookingStatus): Promise<number> {
    return this.prisma.booking.count({
      where: {
        ownerId,
        status: status as PrismaBookingStatus,
      },
    });
  }

  async sumRevenueByOwner(ownerId: string): Promise<number> {
    const result = await this.prisma.booking.aggregate({
      where: {
        ownerId,
        status: PrismaBookingStatus.CONCLUIDA,
      },
      _sum: {
        totalPrice: true,
      },
    });
    return result._sum.totalPrice?.toNumber() ?? 0;
  }

  async hasConflictingBooking(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string,
  ): Promise<boolean> {
    const conflicting = await this.prisma.booking.findFirst({
      where: {
        propertyId,
        status: {
          in: [PrismaBookingStatus.PENDENTE, PrismaBookingStatus.CONFIRMADA],
        },
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        AND: [
          { checkIn: { lt: checkOut } },
          { checkOut: { gt: checkIn } },
        ],
      },
    });
    return conflicting !== null;
  }

  async create(data: CreateBookingData): Promise<Booking> {
    const booking = await this.prisma.booking.create({
      data: {
        propertyId: data.propertyId,
        guestId: data.guestId,
        ownerId: data.ownerId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
        adults: data.adults,
        children: data.children,
        totalNights: data.totalNights,
        pricePerNight: data.pricePerNight,
        cleaningFee: data.cleaningFee,
        serviceFee: data.serviceFee,
        totalPrice: data.totalPrice,
        status: PrismaBookingStatus.PENDENTE,
        message: data.message,
      },
    });
    return this.toDomain(booking);
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.prisma.booking.update({
      where: { id },
      data: { status: status as PrismaBookingStatus },
    });
    return this.toDomain(booking);
  }
}
