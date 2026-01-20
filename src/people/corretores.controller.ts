import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('corretores')
export class CorretoresController {
  constructor(private readonly peopleService: PeopleService) { }

  @Get()
  findAll() {
    return this.peopleService.findAllCorretores();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.peopleService.findCorretor(id);
  }

  @Post()
  create(@Body() createCorretorDto: any) {
    return this.peopleService.createCorretor(createCorretorDto);
  }
}
