import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) { }

  async getEvents(start: string, end: string) {
    // Assuming ISO date strings
    const reservas = await this.prisma.reserva.findMany({
      // where: { checkIn: { gte: start }, checkOut: { lte: end } } // Basic logic
    });
    const visitas = await this.prisma.visita.findMany({
      // where: { data: { gte: start, lte: end } }
    });

    return { reservas, visitas };
  }
}
