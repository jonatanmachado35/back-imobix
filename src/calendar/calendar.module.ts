import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaCalendarRepository } from '../infrastructure/database/prisma-calendar.repository';
import { CALENDAR_REPOSITORY } from './calendar.tokens';

@Module({
  imports: [DatabaseModule],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    { provide: CALENDAR_REPOSITORY, useClass: PrismaCalendarRepository },
  ],
  exports: [CalendarService, CALENDAR_REPOSITORY],
})
export class CalendarModule { }
