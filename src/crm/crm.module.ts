import { Module } from '@nestjs/common';
import { CrmService } from './crm.service';
import { LeadsController } from './leads.controller';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LeadsController],
  providers: [CrmService],
})
export class CrmModule { }
