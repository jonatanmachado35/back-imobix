import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('calendario')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) { }

  @Get('eventos')
  getEvents(@Query('inicio') start: string, @Query('fim') end: string) {
    return this.calendarService.getEvents(start, end);
  }
}
