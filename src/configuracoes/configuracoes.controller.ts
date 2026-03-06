import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetPainelBrandingUseCase } from '../application/use-cases/configuracoes/get-painel-branding.use-case';
import { UpdatePainelBrandingUseCase } from '../application/use-cases/configuracoes/update-painel-branding.use-case';
import { UploadPainelLogoUseCase } from '../application/use-cases/configuracoes/upload-painel-logo.use-case';
import { UpdateBrandingDto } from './dto/update-branding.dto';
@ApiTags('Configurações')
@Controller('configuracoes')
export class ConfiguracoesController {
  constructor(
    private readonly getPainelBranding: GetPainelBrandingUseCase,
    private readonly updatePainelBranding: UpdatePainelBrandingUseCase,
    private readonly uploadPainelLogo: UploadPainelLogoUseCase,
  ) {}

  // ── GET /configuracoes/painel (público, sem autenticação) ─────────────────
  @Get('painel')
  @ApiOperation({
    summary: 'Obter identidade visual do painel (público)',
    description:
      'Retorna branding do tenant identificado por query param. Sem autenticação. ' +
      'Se o tenant não tiver branding configurado, retorna os valores default da plataforma Imobix.',
  })
  @ApiQuery({
    name: 'tenant',
    required: false,
    description: 'Identificador do tenant (slug ou ID). Se omitido, retorna defaults.',
    example: 'beira-mar',
  })
  @ApiResponse({
    status: 200,
    description: 'Identidade visual do tenant',
    schema: {
      example: {
        nomePainel: 'Imobiliária Beira Mar',
        subtitulo: 'Aluguel por temporada',
        corPrimaria: '#2563EB',
        corSidebar: '#1E3A5F',
        logoUrl: 'https://res.cloudinary.com/demo/image/upload/logo.png',
      },
    },
  })
  async getBranding(@Query('tenant') tenantId?: string) {
    return this.getPainelBranding.execute({ tenantId });
  }

  // ── PUT /configuracoes/painel (autenticado, apenas ADMIN) ────────────────
  @Put('painel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar identidade visual do painel',
    description:
      'Apenas ADMIN pode alterar. O tenant é derivado do JWT — ' +
      'o admin só altera o branding do próprio tenant.',
  })
  @ApiResponse({
    status: 200,
    description: 'Branding atualizado',
    schema: {
      example: {
        nomePainel: 'Imobiliária Beira Mar',
        subtitulo: 'Aluguel por temporada',
        corPrimaria: '#2563EB',
        corSidebar: '#1E3A5F',
        logoUrl: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas ADMIN)' })
  async updateBranding(@Request() req, @Body() dto: UpdateBrandingDto) {
    const tenantId: string | null = req.user.tenantId ?? null;

    if (!tenantId) {
      throw new BadRequestException(
        'Usuário não está vinculado a um tenant. Contate o Super Admin.',
      );
    }

    return this.updatePainelBranding.execute({
      tenantId,
      ...dto,
    });
  }

  // ── POST /configuracoes/painel/logo (autenticado, apenas ADMIN) ──────────
  @Post('painel/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload de logo do painel',
    description:
      'Faz upload do logo do tenant. Formatos: JPEG, PNG, SVG. Máx 2MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de logo (JPEG, PNG ou SVG, máx 2MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Logo enviado com sucesso',
    schema: {
      example: { logoUrl: 'https://res.cloudinary.com/demo/image/upload/logo.png' },
    },
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido (tamanho ou formato)' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas ADMIN)' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório.');
    }

    const tenantId: string | null = req.user.tenantId ?? null;

    if (!tenantId) {
      throw new BadRequestException(
        'Usuário não está vinculado a um tenant. Contate o Super Admin.',
      );
    }

    try {
      return await this.uploadPainelLogo.execute({
        tenantId,
        file: {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
