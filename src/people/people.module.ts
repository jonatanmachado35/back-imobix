import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';
import { FuncionariosController } from './funcionarios.controller';
import { CorretoresController } from './corretores.controller';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { UsersModule } from '../users/users.module';
import { PrismaPeopleRepository } from '../infrastructure/database/prisma-people.repository';
import { PEOPLE_REPOSITORY } from './people.tokens';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [FuncionariosController, CorretoresController],
  providers: [
    PeopleService,
    { provide: PEOPLE_REPOSITORY, useClass: PrismaPeopleRepository },
  ],
  exports: [PeopleService, PEOPLE_REPOSITORY],
})
export class PeopleModule { }
