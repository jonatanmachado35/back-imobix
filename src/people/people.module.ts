import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';
import { FuncionariosController } from './funcionarios.controller';
import { CorretoresController } from './corretores.controller';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FuncionariosController, CorretoresController],
  providers: [PeopleService],
})
export class PeopleModule { }
