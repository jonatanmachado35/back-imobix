import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Funcionários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly peopleService: PeopleService) { }

  @Get()
  @ApiOperation({ summary: 'Listar funcionários', description: 'Retorna lista de todos os funcionários cadastrados' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll() {
    return this.peopleService.findAllFuncionarios();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar funcionário por ID', description: 'Retorna dados de um funcionário específico' })
  @ApiParam({ name: 'id', description: 'ID do funcionário' })
  @ApiResponse({ status: 200, description: 'Funcionário encontrado' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findOne(@Param('id') id: string) {
    return this.peopleService.findFuncionario(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo funcionário', description: 'Registra um novo funcionário no sistema' })
  @ApiResponse({ status: 201, description: 'Funcionário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(@Body() createFuncionarioDto: any) {
    return this.peopleService.createFuncionario(createFuncionarioDto);
  }
}
