import { Controller, Get, Post, Body, Param, UseGuards, NotFoundException, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { FuncionarioResponseDto, FuncionarioApiResponseDto } from './dto/funcionario-response.dto';

@ApiTags('Funcionários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly peopleService: PeopleService) { }

  @Get()
  @ApiOperation({ summary: 'Listar funcionários', description: 'Retorna lista de todos os funcionários cadastrados (filtrado pelo tenant do usuário autenticado)' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso', type: [FuncionarioResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@Request() req: any) {
    // Filtra pelo tenant do admin autenticado (ADR-001); SUPER_ADMIN (tenantId=null) vê todos
    return this.peopleService.findAllFuncionarios(req.user.tenantId ?? null);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar funcionário por ID', description: 'Retorna dados de um funcionário específico' })
  @ApiParam({ name: 'id', description: 'ID do funcionário' })
  @ApiResponse({ status: 200, description: 'Funcionário encontrado', type: FuncionarioResponseDto })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async findOne(@Param('id') id: string) {
    const funcionario = await this.peopleService.findFuncionario(id);
    
    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado');
    }
    
    return funcionario;
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo funcionário', description: 'Registra um novo funcionário no sistema' })
  @ApiResponse({ status: 201, description: 'Funcionário criado com sucesso', type: FuncionarioApiResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  create(@Body() createFuncionarioDto: CreateFuncionarioDto, @Request() req: any) {
    // Vincula o funcionário ao tenant do admin autenticado (ADR-001)
    return this.peopleService.createFuncionario({
      ...createFuncionarioDto,
      tenantId: req.user.tenantId ?? null,
    });
  }
}
