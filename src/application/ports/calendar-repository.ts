import { Reserva, Visita } from '@prisma/client';

export interface CalendarRepository {
  findReservas(start?: Date, end?: Date): Promise<Reserva[]>;
  findVisitas(start?: Date, end?: Date): Promise<Visita[]>;
}
