import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCorretorDto } from './dto/create-corretor.dto';
import { CorretorResponseDto } from './dto/corretor-response.dto';

@ApiTags('Corretores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('corretores')
export class CorretoresController {
  constructor(private readonly peopleService: PeopleService) { }

  @Get()
  @ApiOperation({ summary: 'Listar corretores', description: 'Retorna lista de corretores do tenant autenticado' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso', type: [CorretorResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@Request() req: any) {
    // Filtra pelo tenant do admin autenticado (ADR-001); SUPER_ADMIN (tenantId=null) vê todos
    return this.peopleService.findAllCorretores(req.user.tenantId ?? null);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar corretor por ID', description: 'Retorna dados de um corretor específico' })
  @ApiParam({ name: 'id', description: 'ID do corretor' })
  @ApiResponse({ status: 200, description: 'Corretor encontrado', type: CorretorResponseDto })
  @ApiResponse({ status: 404, description: 'Corretor não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findOne(@Param('id') id: string) {
    return this.peopleService.findCorretor(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo corretor', description: 'Registra um novo corretor no sistema' })
  @ApiResponse({ status: 201, description: 'Corretor criado com sucesso', type: CorretorResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(@Body() createCorretorDto: CreateCorretorDto) {
    return this.peopleService.createCorretor(createCorretorDto);
  }
}
