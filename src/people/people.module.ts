import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';
import { FuncionariosController } from './funcionarios.controller';
import { CorretoresController } from './corretores.controller';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [FuncionariosController, CorretoresController],
  providers: [PeopleService],
})
export class PeopleModule { }
