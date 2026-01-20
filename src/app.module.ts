import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './auth/auth.module';

import { PeopleModule } from './people/people.module';
import { CrmModule } from './crm/crm.module';
import { RealEstateModule } from './real-estate/real-estate.module';
import { FinanceModule } from './finance/finance.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    PeopleModule,
    CrmModule,
    RealEstateModule,
    FinanceModule,
    CalendarModule
  ]
})
export class AppModule { }
