import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaFinanceRepository } from '../infrastructure/database/prisma-finance.repository';
import { FINANCE_REPOSITORY } from './finance.tokens';

@Module({
  imports: [DatabaseModule],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    { provide: FINANCE_REPOSITORY, useClass: PrismaFinanceRepository },
  ],
  exports: [FinanceService, FINANCE_REPOSITORY],
})
export class FinanceModule { }
