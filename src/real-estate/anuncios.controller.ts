import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Request,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { RealEstateService } from './real-estate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';
import { AnuncioResponseDto, UpdateAnuncioStatusDto } from './dto/anuncio-response.dto';
import { UploadImageDto, ImageResponseDto } from './dto/upload-image.dto';
import { UploadAnuncioImageUseCase } from '../application/use-cases/anuncio-images/upload-anuncio-image.use-case';
import { DeleteAnuncioImageUseCase } from '../application/use-cases/anuncio-images/delete-anuncio-image.use-case';
import { ListAnuncioImagesUseCase } from '../application/use-cases/anuncio-images/list-anuncio-images.use-case';
import { SetPrimaryImageUseCase } from '../application/use-cases/anuncio-images/set-primary-image.use-case';
import { CreateAnuncioWithImagesUseCase } from '../application/use-cases/anuncio-images/create-anuncio-with-images.use-case';
import { DeleteAnuncioUseCase } from '../application/use-cases/anuncio-images/delete-anuncio.use-case';

@ApiTags('Anúncios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('anuncios')
export class AnunciosController {
  constructor(
    private readonly realEstateService: RealEstateService,
    private readonly uploadImageUseCase: UploadAnuncioImageUseCase,
    private readonly deleteImageUseCase: DeleteAnuncioImageUseCase,
    private readonly listImagesUseCase: ListAnuncioImagesUseCase,
    private readonly setPrimaryImageUseCase: SetPrimaryImageUseCase,
    private readonly createAnuncioWithImagesUseCase: CreateAnuncioWithImagesUseCase,
    private readonly deleteAnuncioUseCase: DeleteAnuncioUseCase,
  ) { }

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
  @UseInterceptors(FilesInterceptor('images', 20))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Criar novo anúncio com imagens',
    description: 'Cadastra um novo anúncio de imóvel com pelo menos 1 imagem (obrigatória)'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string', example: 'Casa na Praia' },
        tipo: { type: 'string', example: 'CASA_PRAIA' },
        endereco: { type: 'string', example: 'Rua da Praia, 123' },
        cidade: { type: 'string', example: 'Florianópolis' },
        estado: { type: 'string', example: 'SC' },
        valor: { type: 'number', example: 500000 },
        descricao: { type: 'string', example: 'Linda casa com vista para o mar' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Imagens do anúncio (mínimo 1, máximo 20)',
          minItems: 1,
          maxItems: 20,
        },
      },
      required: ['titulo', 'tipo', 'endereco', 'cidade', 'estado', 'valor', 'images'],
    },
  })
  @ApiResponse({ status: 201, description: 'Anúncio criado com sucesso', type: AnuncioResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou imagens ausentes' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async create(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB por imagem
        ],
        fileIsRequired: false, // Validação feita no use case
      }),
    )
    files: Express.Multer.File[],
    @Body() createAnuncioDto: CreateAnuncioDto,
    @Request() req,
  ) {
    const filesDtos = files?.map(file => ({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    })) || [];

    return this.createAnuncioWithImagesUseCase.execute(createAnuncioDto, filesDtos, req.user.sub);
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

  // ========== ENDPOINTS DE IMAGENS ==========

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de imagem para anúncio', description: 'Faz upload de uma imagem e associa ao anúncio' })
  @ApiParam({ name: 'id', description: 'ID do anúncio' })
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
          description: 'Define se é a imagem principal',
          default: false,
        },
        displayOrder: {
          type: 'number',
          description: 'Ordem de exibição',
          default: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Imagem enviada com sucesso', type: ImageResponseDto })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou limite excedido' })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  async uploadImage(
    @Param('id') anuncioId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() uploadDto?: UploadImageDto,
  ) {
    const fileDto = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    return this.uploadImageUseCase.execute(
      anuncioId,
      fileDto,
      uploadDto?.isPrimary || false,
      uploadDto?.displayOrder || 0,
    );
  }

  @Get(':id/images')
  @ApiOperation({ summary: 'Listar imagens do anúncio', description: 'Retorna todas as imagens associadas ao anúncio' })
  @ApiParam({ name: 'id', description: 'ID do anúncio' })
  @ApiResponse({ status: 200, description: 'Lista de imagens', type: [ImageResponseDto] })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  async listImages(@Param('id') anuncioId: string) {
    return this.listImagesUseCase.execute(anuncioId);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Deletar imagem do anúncio', description: 'Remove uma imagem do anúncio' })
  @ApiParam({ name: 'id', description: 'ID do anúncio' })
  @ApiParam({ name: 'imageId', description: 'ID da imagem' })
  @ApiResponse({ status: 200, description: 'Imagem deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Imagem ou anúncio não encontrado' })
  async deleteImage(
    @Param('id') anuncioId: string,
    @Param('imageId') imageId: string,
  ) {
    await this.deleteImageUseCase.execute(anuncioId, imageId);
    return { message: 'Imagem deletada com sucesso' };
  }

  @Patch(':id/images/:imageId/primary')
  @ApiOperation({ summary: 'Definir imagem primária', description: 'Define uma imagem como principal do anúncio' })
  @ApiParam({ name: 'id', description: 'ID do anúncio' })
  @ApiParam({ name: 'imageId', description: 'ID da imagem' })
  @ApiResponse({ status: 200, description: 'Imagem primária atualizada', type: ImageResponseDto })
  @ApiResponse({ status: 404, description: 'Imagem ou anúncio não encontrado' })
  async setPrimaryImage(
    @Param('id') anuncioId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.setPrimaryImageUseCase.execute(anuncioId, imageId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar anúncio',
    description: 'Remove o anúncio e todas as suas imagens do Cloudinary'
  })
  @ApiParam({ name: 'id', description: 'ID do anúncio' })
  @ApiResponse({ status: 204, description: 'Anúncio deletado com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão para deletar este anúncio' })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async delete(@Param('id') id: string, @Request() req) {
    await this.deleteAnuncioUseCase.execute(id, req.user.sub, req.user.role);
    return;
  }
}
