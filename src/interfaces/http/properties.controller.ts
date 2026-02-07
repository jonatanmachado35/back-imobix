import { Controller, Get, Param, Query, NotFoundException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ListPropertiesUseCase } from '../../application/use-cases/properties/list-properties.use-case';
import { GetPropertyUseCase, PropertyNotFoundError } from '../../application/use-cases/properties/get-property.use-case';
import { PropertyRepository } from '../../application/ports/property-repository';
import { PROPERTY_REPOSITORY } from '../../properties/properties.tokens';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly listPropertiesUseCase: ListPropertiesUseCase,
    private readonly getPropertyUseCase: GetPropertyUseCase,
    @Inject(PROPERTY_REPOSITORY) private readonly propertyRepository: PropertyRepository,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Listar imóveis', description: 'Lista imóveis ativos com filtros opcionais' })
  @ApiQuery({ name: 'type', required: false, enum: ['VENDA', 'ALUGUEL', 'TEMPORADA'] })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'bedrooms', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de imóveis' })
  async list(
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('bedrooms') bedrooms?: string
  ) {
    const properties = await this.listPropertiesUseCase.execute({
      type,
      city,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
    });

    return properties.map((p) => p.toJSON());
  }

  @Get('featured')
  @ApiOperation({ summary: 'Imóveis em destaque', description: 'Lista imóveis em destaque' })
  @ApiResponse({ status: 200, description: 'Lista de imóveis em destaque' })
  async featured() {
    const properties = await this.listPropertiesUseCase.execute({ status: 'ATIVO' });
    // Return first 6 as featured
    return properties.slice(0, 6).map((p) => p.toJSON());
  }

  @Get('seasonal')
  @ApiOperation({ summary: 'Imóveis de temporada', description: 'Lista imóveis de temporada' })
  @ApiResponse({ status: 200, description: 'Lista de imóveis de temporada' })
  async seasonal() {
    const properties = await this.listPropertiesUseCase.execute({ type: 'TEMPORADA' });
    return properties.map((p) => p.toJSON());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter imóvel', description: 'Obtém detalhes de um imóvel' })
  @ApiResponse({ status: 200, description: 'Detalhes do imóvel' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  async getById(@Param('id') id: string) {
    try {
      const property = await this.getPropertyUseCase.execute(id);
      return property.toJSON();
    } catch (error) {
      if (error instanceof PropertyNotFoundError) {
        throw new NotFoundException('Property not found');
      }
      throw error;
    }
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Verificar disponibilidade', description: 'Verifica disponibilidade do imóvel' })
  @ApiQuery({ name: 'checkIn', required: true, example: '2026-03-01' })
  @ApiQuery({ name: 'checkOut', required: true, example: '2026-03-07' })
  @ApiResponse({ status: 200, description: 'Disponibilidade do imóvel' })
  async checkAvailability(
    @Param('id') id: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string
  ) {
    try {
      const property = await this.getPropertyUseCase.execute(id);

      // Check for conflicting bookings
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const hasConflict = await this.propertyRepository.hasConflictingBooking(
        id,
        checkInDate,
        checkOutDate
      );

      return {
        available: !hasConflict,
        property: property.toJSON(),
        checkIn,
        checkOut,
      };
    } catch (error) {
      if (error instanceof PropertyNotFoundError) {
        throw new NotFoundException('Property not found');
      }
      throw error;
    }
  }
}
