import {
  Controller, Get, Post, Patch, Delete, Param, Body, Request, UseGuards,
  NotFoundException, ForbiddenException, BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreatePropertyUseCase, InvalidPropertyInputError } from '../../application/use-cases/properties/create-property.use-case';
import { ListOwnerPropertiesUseCase } from '../../application/use-cases/properties/list-owner-properties.use-case';
import { UpdatePropertyUseCase, PropertyNotFoundError, NotPropertyOwnerError } from '../../application/use-cases/properties/update-property.use-case';
import { UpdatePropertyStatusUseCase } from '../../application/use-cases/properties/update-property-status.use-case';
import { CreatePropertyDto, UpdatePropertyDto, UpdateStatusDto } from './dto/property.dto';

@ApiTags('Proprietário')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proprietario')
export class ProprietarioController {
  constructor(
    private readonly createPropertyUseCase: CreatePropertyUseCase,
    private readonly listOwnerPropertiesUseCase: ListOwnerPropertiesUseCase,
    private readonly updatePropertyUseCase: UpdatePropertyUseCase,
    private readonly updatePropertyStatusUseCase: UpdatePropertyStatusUseCase
  ) { }

  @Get('properties')
  @ApiOperation({ summary: 'Listar meus imóveis', description: 'Lista imóveis do proprietário autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de imóveis do proprietário' })
  async listMyProperties(@Request() req) {
    const properties = await this.listOwnerPropertiesUseCase.execute(req.user.userId);
    return properties.map((p) => p.toJSON());
  }

  @Post('properties')
  @ApiOperation({ summary: 'Criar imóvel', description: 'Cria um novo imóvel' })
  @ApiResponse({ status: 201, description: 'Imóvel criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createProperty(@Request() req, @Body() dto: CreatePropertyDto) {
    try {
      const property = await this.createPropertyUseCase.execute({
        ownerId: req.user.userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        pricePerNight: dto.pricePerNight,
        holidayPrice: dto.holidayPrice,
        address: dto.address,
        city: dto.city,
        neighborhood: dto.neighborhood,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        parkingSpaces: dto.parkingSpaces,
        area: dto.area,
        amenities: dto.amenities,
        petFriendly: dto.petFriendly,
        furnished: dto.furnished,
        minNights: dto.minNights,
        maxGuests: dto.maxGuests,
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        houseRules: dto.houseRules,
        category: dto.category,
      });
      return property.toJSON();
    } catch (error) {
      if (error instanceof InvalidPropertyInputError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Patch('properties/:id')
  @ApiOperation({ summary: 'Atualizar imóvel', description: 'Atualiza dados de um imóvel' })
  @ApiResponse({ status: 200, description: 'Imóvel atualizado' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  @ApiResponse({ status: 403, description: 'Não é o proprietário' })
  async updateProperty(
    @Request() req,
    @Param('id') propertyId: string,
    @Body() dto: UpdatePropertyDto
  ) {
    try {
      const property = await this.updatePropertyUseCase.execute({
        propertyId,
        ownerId: req.user.userId,
        data: dto,
      });
      return property.toJSON();
    } catch (error) {
      if (error instanceof PropertyNotFoundError) {
        throw new NotFoundException('Property not found');
      }
      if (error instanceof NotPropertyOwnerError) {
        throw new ForbiddenException('You are not the owner of this property');
      }
      throw error;
    }
  }

  @Patch('properties/:id/status')
  @ApiOperation({ summary: 'Alterar status', description: 'Ativa, pausa ou remove um imóvel' })
  @ApiResponse({ status: 200, description: 'Status alterado' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  @ApiResponse({ status: 403, description: 'Não é o proprietário' })
  async updateStatus(
    @Request() req,
    @Param('id') propertyId: string,
    @Body() dto: UpdateStatusDto
  ) {
    try {
      const property = await this.updatePropertyStatusUseCase.execute({
        propertyId,
        ownerId: req.user.userId,
        action: dto.action,
      });
      return property.toJSON();
    } catch (error) {
      if (error instanceof PropertyNotFoundError) {
        throw new NotFoundException('Property not found');
      }
      if (error instanceof NotPropertyOwnerError) {
        throw new ForbiddenException('You are not the owner of this property');
      }
      throw error;
    }
  }

  @Delete('properties/:id')
  @ApiOperation({ summary: 'Remover imóvel', description: 'Remove um imóvel (soft delete)' })
  @ApiResponse({ status: 200, description: 'Imóvel removido' })
  async deleteProperty(@Request() req, @Param('id') propertyId: string) {
    try {
      await this.updatePropertyStatusUseCase.execute({
        propertyId,
        ownerId: req.user.userId,
        action: 'remove',
      });
      return { message: 'Property removed successfully' };
    } catch (error) {
      if (error instanceof PropertyNotFoundError) {
        throw new NotFoundException('Property not found');
      }
      if (error instanceof NotPropertyOwnerError) {
        throw new ForbiddenException('You are not the owner of this property');
      }
      throw error;
    }
  }
}
