import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly crmService: CrmService) { }

  @Get()
  findAll() {
    return this.crmService.findAll();
  }

  @Post()
  create(@Body() createLeadDto: any) {
    return this.crmService.create(createLeadDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeadDto: any) {
    return this.crmService.update(id, updateLeadDto);
  }
}
