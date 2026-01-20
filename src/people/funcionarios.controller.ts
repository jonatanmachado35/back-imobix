import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly peopleService: PeopleService) { }

  @Get()
  findAll() {
    return this.peopleService.findAllFuncionarios();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.peopleService.findFuncionario(id);
  }

  @Post()
  create(@Body() createFuncionarioDto: any) {
    return this.peopleService.createFuncionario(createFuncionarioDto);
  }
}
