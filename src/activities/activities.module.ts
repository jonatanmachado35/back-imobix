import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { PrismaActivityRepository } from '../infrastructure/database/prisma-activity.repository';
import { ActivityRepository } from '../application/ports/activity-repository';
import { ListActivitiesUseCase } from '../application/use-cases/activities/list-activities.use-case';
import { ActivitiesController } from '../interfaces/http/activities.controller';

export const ACTIVITY_REPOSITORY = Symbol('ACTIVITY_REPOSITORY');

@Module({
  imports: [DatabaseModule],
  controllers: [ActivitiesController],
  providers: [
    PrismaService,
    { provide: ACTIVITY_REPOSITORY, useClass: PrismaActivityRepository },
    {
      provide: ListActivitiesUseCase,
      useFactory: (activityRepo: ActivityRepository) => new ListActivitiesUseCase(activityRepo),
      inject: [ACTIVITY_REPOSITORY],
    },
  ],
  exports: [ACTIVITY_REPOSITORY],
})
export class ActivitiesModule { }
