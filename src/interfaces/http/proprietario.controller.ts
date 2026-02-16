import {
  Controller, Get, Post, Patch, Delete, Param, Body, Request, UseGuards,
  NotFoundException, ForbiddenException, BadRequestException,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreatePropertyUseCase, InvalidPropertyInputError } from '../../application/use-cases/properties/create-property.use-case';
import { ListOwnerPropertiesUseCase } from '../../application/use-cases/properties/list-owner-properties.use-case';
import { UpdatePropertyUseCase, PropertyNotFoundError, NotPropertyOwnerError } from '../../application/use-cases/properties/update-property.use-case';
import { UpdatePropertyStatusUseCase } from '../../application/use-cases/properties/update-property-status.use-case';
import { CreatePropertyDto, UpdatePropertyDto, UpdateStatusDto } from './dto/property.dto';
import { UploadPropertyImageUseCase } from '../../application/use-cases/property-images/upload-property-image.use-case';
import { ListPropertyImagesUseCase } from '../../application/use-cases/property-images/list-property-images.use-case';
import { DeletePropertyImageUseCase } from '../../application/use-cases/property-images/delete-property-image.use-case';
import { SetPrimaryPropertyImageUseCase } from '../../application/use-cases/property-images/set-primary-property-image.use-case';
import { UploadPropertyImageDto } from './dto/upload-property-image.dto';

@ApiTags('Proprietário')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proprietario')
export class ProprietarioController {
  constructor(
    private readonly createPropertyUseCase: CreatePropertyUseCase,
    private readonly listOwnerPropertiesUseCase: ListOwnerPropertiesUseCase,
    private readonly updatePropertyUseCase: UpdatePropertyUseCase,
    private readonly updatePropertyStatusUseCase: UpdatePropertyStatusUseCase,
    private readonly uploadPropertyImageUseCase: UploadPropertyImageUseCase,
    private readonly listPropertyImagesUseCase: ListPropertyImagesUseCase,
    private readonly deletePropertyImageUseCase: DeletePropertyImageUseCase,
    private readonly setPrimaryPropertyImageUseCase: SetPrimaryPropertyImageUseCase,
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

  @Get('properties/:id/images')
  @ApiOperation({ summary: 'Listar imagens do imóvel', description: 'Lista imagens de um imóvel do proprietário autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de imagens' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  @ApiResponse({ status: 403, description: 'Não é o proprietário' })
  async listPropertyImages(@Request() req, @Param('id') propertyId: string) {
    try {
      return await this.listPropertyImagesUseCase.execute(propertyId, req.user.userId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw error;
    }
  }

  @Post('properties/:id/images')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPEG, PNG, WEBP, máx 10MB)',
        },
        isPrimary: {
          type: 'boolean',
          description: 'Define se a imagem será principal',
          default: false,
        },
        displayOrder: {
          type: 'number',
          description: 'Ordem de exibição da imagem',
          default: 0,
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload imagem do imóvel', description: 'Faz upload de imagem para um imóvel do proprietário autenticado' })
  @ApiResponse({ status: 201, description: 'Imagem enviada com sucesso' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  @ApiResponse({ status: 403, description: 'Não é o proprietário' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido' })
  async uploadPropertyImage(
    @Request() req,
    @Param('id') propertyId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() uploadDto?: UploadPropertyImageDto,
  ) {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo inválido. Use apenas JPEG, PNG ou WEBP.');
    }

    const fileDto = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    const isPrimaryRaw = (uploadDto as any)?.isPrimary;
    const displayOrderRaw = (uploadDto as any)?.displayOrder;

    const isPrimary =
      isPrimaryRaw === true || isPrimaryRaw === 'true' || isPrimaryRaw === 1 || isPrimaryRaw === '1';

    const displayOrder =
      displayOrderRaw !== undefined && displayOrderRaw !== null
        ? Number(displayOrderRaw)
        : 0;

    return this.uploadPropertyImageUseCase.execute(
      propertyId,
      req.user.userId,
      fileDto,
      isPrimary,
      Number.isNaN(displayOrder) ? 0 : displayOrder,
    );
  }

  @Delete('properties/:id/images/:imageId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Deletar imagem do imóvel', description: 'Remove imagem de um imóvel do proprietário autenticado' })
  @ApiResponse({ status: 204, description: 'Imagem removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Imóvel ou imagem não encontrados' })
  @ApiResponse({ status: 403, description: 'Não é o proprietário' })
  async deletePropertyImage(
    @Request() req,
    @Param('id') propertyId: string,
    @Param('imageId') imageId: string,
  ) {
    await this.deletePropertyImageUseCase.execute(propertyId, imageId, req.user.userId);
    return;
  }

  @Patch('properties/:id/images/:imageId/primary')
  @ApiOperation({ summary: 'Definir imagem principal do imóvel', description: 'Define uma imagem como principal para o imóvel do proprietário autenticado' })
  @ApiResponse({ status: 200, description: 'Imagem principal atualizada' })
  @ApiResponse({ status: 404, description: 'Imóvel ou imagem não encontrados' })
  @ApiResponse({ status: 403, description: 'Não é o proprietário' })
  async setPrimaryPropertyImage(
    @Request() req,
    @Param('id') propertyId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.setPrimaryPropertyImageUseCase.execute(propertyId, imageId, req.user.userId);
  }
}
