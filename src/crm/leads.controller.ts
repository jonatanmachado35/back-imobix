import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLeadDto } from '../interfaces/http/dto/create-lead.dto';
import { UpdateLeadDto } from '../interfaces/http/dto/update-lead.dto';
import { LeadResponseDto, LeadListResponseDto } from '../interfaces/http/dto/lead-response.dto';

@ApiTags('CRM - Leads (Legado)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly crmService: CrmService) { }

  @Get()
  @ApiOperation({ summary: '[Legado] Listar leads', description: 'Endpoint legado - Use /leads do novo sistema' })
  @ApiResponse({ status: 200, description: 'Lista de leads', type: [LeadListResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll() {
    return this.crmService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '[Legado] Criar lead', description: 'Endpoint legado - Use POST /leads do novo sistema' })
  @ApiResponse({ status: 201, description: 'Lead criado', type: LeadResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.crmService.create(createLeadDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '[Legado] Atualizar lead', description: 'Endpoint legado - Use PUT /leads/:id do novo sistema' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  @ApiResponse({ status: 200, description: 'Lead atualizado', type: LeadResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.crmService.update(id, updateLeadDto);
  }
}
