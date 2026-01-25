import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Corretores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('corretores')
export class CorretoresController {
  constructor(private readonly peopleService: PeopleService) { }

  @Get()
  @ApiOperation({ summary: 'Listar corretores', description: 'Retorna lista de todos os corretores cadastrados' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll() {
    return this.peopleService.findAllCorretores();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar corretor por ID', description: 'Retorna dados de um corretor específico' })
  @ApiParam({ name: 'id', description: 'ID do corretor' })
  @ApiResponse({ status: 200, description: 'Corretor encontrado' })
  @ApiResponse({ status: 404, description: 'Corretor não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findOne(@Param('id') id: string) {
    return this.peopleService.findCorretor(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo corretor', description: 'Registra um novo corretor no sistema' })
  @ApiResponse({ status: 201, description: 'Corretor criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(@Body() createCorretorDto: any) {
    return this.peopleService.createCorretor(createCorretorDto);
  }
}
