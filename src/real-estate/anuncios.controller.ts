import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RealEstateService } from './real-estate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';
import { AnuncioResponseDto, UpdateAnuncioStatusDto } from './dto/anuncio-response.dto';

@ApiTags('Anúncios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('anuncios')
export class AnunciosController {
  constructor(private readonly realEstateService: RealEstateService) { }

  @Get()
  @ApiOperation({ summary: 'Listar anúncios', description: 'Retorna lista de todos os anúncios de imóveis' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso', type: [AnuncioResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll() {
    return this.realEstateService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar anúncio por ID', description: 'Retorna dados detalhados de um anúncio específico' })
  @ApiParam({ name: 'id', description: 'ID do anúncio' })
  @ApiResponse({ status: 200, description: 'Anúncio encontrado', type: AnuncioResponseDto })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findOne(@Param('id') id: string) {
    return this.realEstateService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo anúncio', description: 'Cadastra um novo anúncio de imóvel' })
  @ApiResponse({ status: 201, description: 'Anúncio criado com sucesso', type: AnuncioResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(@Body() createAnuncioDto: CreateAnuncioDto) {
    return this.realEstateService.create(createAnuncioDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar anúncio', description: 'Atualiza dados de um anúncio existente' })
  @ApiParam({ name: 'id', description: 'ID do anúncio' })
  @ApiResponse({ status: 200, description: 'Anúncio atualizado com sucesso', type: AnuncioResponseDto })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  update(@Param('id') id: string, @Body() updateAnuncioDto: UpdateAnuncioDto) {
    return this.realEstateService.update(id, updateAnuncioDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do anúncio', description: 'Altera o status de publicação do anúncio (ativo/inativo)' })
  @ApiParam({ name: 'id', description: 'ID do anúncio' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso', type: AnuncioResponseDto })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  updateStatus(@Param('id') id: string, @Body() statusDto: UpdateAnuncioStatusDto) {
    return this.realEstateService.updateStatus(id, statusDto.status);
  }
}
