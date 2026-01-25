import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateLeadUseCase } from '../../application/use-cases/create-lead.use-case';
import { QualifyLeadUseCase } from '../../application/use-cases/qualify-lead.use-case';
import { UpdateLeadUseCase } from '../../application/use-cases/update-lead.use-case';
import { ConvertLeadUseCase } from '../../application/use-cases/convert-lead.use-case';
import { GetLeadByIdUseCase } from '../../application/use-cases/get-lead-by-id.use-case';
import { ListLeadsUseCase } from '../../application/use-cases/list-leads.use-case';
import {
  LeadAlreadyExistsError,
  LeadNotFoundError
} from '../../application/use-cases/lead-errors';
import { InvalidLeadDataError } from '../../domain/entities/lead';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadResponseDto, LeadListResponseDto, LeadStatusResponseDto } from './dto/lead-response.dto';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly createLead: CreateLeadUseCase,
    private readonly qualifyLead: QualifyLeadUseCase,
    private readonly updateLead: UpdateLeadUseCase,
    private readonly convertLead: ConvertLeadUseCase,
    private readonly getLeadById: GetLeadByIdUseCase,
    private readonly listLeads: ListLeadsUseCase
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo lead', description: 'Cria um novo lead no sistema CRM' })
  @ApiResponse({ status: 201, description: 'Lead criado com sucesso', type: LeadResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async create(@Body() dto: CreateLeadDto) {
    try {
      const lead = await this.createLead.execute(dto);
      return {
        id: lead.id,
        nome: lead.nome,
        email: lead.email,
        telefone: lead.telefone,
        origem: lead.origem,
        interesse: lead.interesse,
        status: lead.status,
        anotacoes: lead.anotacoes,
        dataContato: lead.dataContato,
        updatedAt: lead.updatedAt
      };
    } catch (error) {
      if (error instanceof LeadAlreadyExistsError) {
        throw new ConflictException('Email already exists');
      }
      if (error instanceof InvalidLeadDataError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os leads', description: 'Retorna lista completa de leads cadastrados' })
  @ApiResponse({ status: 200, description: 'Lista de leads retornada com sucesso', type: [LeadListResponseDto] })
  async findAll() {
    const leads = await this.listLeads.execute();
    return leads.map((lead) => ({
      id: lead.id,
      nome: lead.nome,
      email: lead.email,
      telefone: lead.telefone,
      origem: lead.origem,
      interesse: lead.interesse,
      status: lead.status,
      dataContato: lead.dataContato
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar lead por ID', description: 'Retorna informações detalhadas de um lead específico' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  @ApiResponse({ status: 200, description: 'Lead encontrado', type: LeadResponseDto })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  async findOne(@Param('id') id: string) {
    try {
      const lead = await this.getLeadById.execute(id);
      return {
        id: lead.id,
        nome: lead.nome,
        email: lead.email,
        telefone: lead.telefone,
        origem: lead.origem,
        interesse: lead.interesse,
        status: lead.status,
        anotacoes: lead.anotacoes,
        dataContato: lead.dataContato,
        updatedAt: lead.updatedAt
      };
    } catch (error) {
      if (error instanceof LeadNotFoundError) {
        throw new NotFoundException('Lead not found');
      }
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar lead', description: 'Atualiza informações de um lead existente' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  @ApiResponse({ status: 200, description: 'Lead atualizado com sucesso', type: LeadResponseDto })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  async update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    try {
      const lead = await this.updateLead.execute(id, dto);
      return {
        id: lead.id,
        nome: lead.nome,
        email: lead.email,
        telefone: lead.telefone,
        origem: lead.origem,
        interesse: lead.interesse,
        status: lead.status,
        anotacoes: lead.anotacoes,
        updatedAt: lead.updatedAt
      };
    } catch (error) {
      if (error instanceof LeadNotFoundError) {
        throw new NotFoundException('Lead not found');
      }
      throw error;
    }
  }

  @Patch(':id/qualify')
  @ApiOperation({ summary: 'Qualificar lead', description: 'Marca o lead como qualificado (NOVO → QUALIFICADO)' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  @ApiResponse({ status: 200, description: 'Lead qualificado com sucesso', type: LeadStatusResponseDto })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  async qualify(@Param('id') id: string) {
    try {
      const lead = await this.qualifyLead.execute(id);
      return {
        id: lead.id,
        status: lead.status,
        updatedAt: lead.updatedAt
      };
    } catch (error) {
      if (error instanceof LeadNotFoundError) {
        throw new NotFoundException('Lead not found');
      }
      throw error;
    }
  }

  @Patch(':id/convert')
  @ApiOperation({ summary: 'Converter lead', description: 'Converte lead qualificado em cliente (QUALIFICADO → CONVERTIDO)' })
  @ApiParam({ name: 'id', description: 'ID do lead' })
  @ApiResponse({ status: 200, description: 'Lead convertido com sucesso', type: LeadStatusResponseDto })
  @ApiResponse({ status: 400, description: 'Lead precisa estar qualificado primeiro' })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  async convert(@Param('id') id: string) {
    try {
      const lead = await this.convertLead.execute(id);
      return {
        id: lead.id,
        status: lead.status,
        updatedAt: lead.updatedAt
      };
    } catch (error) {
      if (error instanceof LeadNotFoundError) {
        throw new NotFoundException('Lead not found');
      }
      throw error;
    }
  }
}
