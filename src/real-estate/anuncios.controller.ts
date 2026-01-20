import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { RealEstateService } from './real-estate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('anuncios')
export class AnunciosController {
  constructor(private readonly realEstateService: RealEstateService) { }

  @Get()
  findAll() {
    return this.realEstateService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.realEstateService.findOne(id);
  }

  @Post()
  create(@Body() createAnuncioDto: any) {
    return this.realEstateService.create(createAnuncioDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAnuncioDto: any) {
    return this.realEstateService.update(id, updateAnuncioDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.realEstateService.updateStatus(id, status);
  }
}
