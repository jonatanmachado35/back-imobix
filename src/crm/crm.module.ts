import { Module } from '@nestjs/common';
import { LeadsController } from '../interfaces/http/leads.controller';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { PrismaLeadRepository } from '../infrastructure/database/prisma-lead.repository';
import { LeadRepository } from '../application/ports/lead-repository';
import { CreateLeadUseCase } from '../application/use-cases/create-lead.use-case';
import { QualifyLeadUseCase } from '../application/use-cases/qualify-lead.use-case';
import { UpdateLeadUseCase } from '../application/use-cases/update-lead.use-case';
import { ConvertLeadUseCase } from '../application/use-cases/convert-lead.use-case';
import { ContactLeadUseCase } from '../application/use-cases/contact-lead.use-case';
import { LostLeadUseCase } from '../application/use-cases/lost-lead.use-case';
import { GetLeadByIdUseCase } from '../application/use-cases/get-lead-by-id.use-case';
import { ListLeadsUseCase } from '../application/use-cases/list-leads.use-case';
import { LEAD_REPOSITORY } from './crm.tokens';

@Module({
  imports: [DatabaseModule],
  controllers: [LeadsController],
  providers: [
    PrismaService,
    { provide: LEAD_REPOSITORY, useClass: PrismaLeadRepository },
    {
      provide: CreateLeadUseCase,
      useFactory: (leadRepository: LeadRepository) =>
        new CreateLeadUseCase(leadRepository),
      inject: [LEAD_REPOSITORY]
    },
    {
      provide: QualifyLeadUseCase,
      useFactory: (leadRepository: LeadRepository) =>
        new QualifyLeadUseCase(leadRepository),
      inject: [LEAD_REPOSITORY]
    },
    {
      provide: UpdateLeadUseCase,
      useFactory: (leadRepository: LeadRepository) =>
        new UpdateLeadUseCase(leadRepository),
      inject: [LEAD_REPOSITORY]
    },
    {
      provide: ConvertLeadUseCase,
      useFactory: (leadRepository: LeadRepository) =>
        new ConvertLeadUseCase(leadRepository),
      inject: [LEAD_REPOSITORY]
    },
    {
      provide: ContactLeadUseCase,
      useFactory: (leadRepository: LeadRepository) =>
        new ContactLeadUseCase(leadRepository),
      inject: [LEAD_REPOSITORY]
    },
    {
      provide: LostLeadUseCase,
      useFactory: (leadRepository: LeadRepository) =>
        new LostLeadUseCase(leadRepository),
      inject: [LEAD_REPOSITORY]
    },
    {
      provide: GetLeadByIdUseCase,
      useFactory: (leadRepository: LeadRepository) =>
        new GetLeadByIdUseCase(leadRepository),
      inject: [LEAD_REPOSITORY]
    },
    {
      provide: ListLeadsUseCase,
      useFactory: (leadRepository: LeadRepository) =>
        new ListLeadsUseCase(leadRepository),
      inject: [LEAD_REPOSITORY]
    }
  ]
})
export class CrmModule {}
