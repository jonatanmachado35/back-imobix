import { Inject, Injectable } from '@nestjs/common';
import { CalendarRepository } from '../application/ports/calendar-repository';
import { CALENDAR_REPOSITORY } from './calendar.tokens';

@Injectable()
export class CalendarService {
  constructor(
    @Inject(CALENDAR_REPOSITORY) private readonly calendarRepository: CalendarRepository,
  ) {}

  async getEvents(start: string, end: string) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    
    const reservas = await this.calendarRepository.findReservas(startDate, endDate);
    const visitas = await this.calendarRepository.findVisitas(startDate, endDate);

    return { reservas, visitas };
  }
}
