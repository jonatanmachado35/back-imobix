import { Injectable } from '@nestjs/common';
import { CalendarRepository } from '../../application/ports/calendar-repository';
import { PrismaService } from '../database/prisma.service';
import { Reserva, Visita } from '@prisma/client';

@Injectable()
export class PrismaCalendarRepository implements CalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findReservas(start?: Date, end?: Date): Promise<Reserva[]> {
    return this.prisma.reserva.findMany();
  }

  async findVisitas(start?: Date, end?: Date): Promise<Visita[]> {
    return this.prisma.visita.findMany();
  }
}
