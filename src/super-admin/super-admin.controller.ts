import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  NotFoundException,
  ConflictException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ListTenantsUseCase } from '../application/use-cases/super-admin/list-tenants.use-case';
import { GetTenantUseCase } from '../application/use-cases/super-admin/get-tenant.use-case';
import { CreateTenantUseCase } from '../application/use-cases/super-admin/create-tenant.use-case';
import { UpdateTenantUseCase } from '../application/use-cases/super-admin/update-tenant.use-case';
import { SuspendTenantUseCase } from '../application/use-cases/super-admin/suspend-tenant.use-case';
import { ReactivateTenantUseCase } from '../application/use-cases/super-admin/reactivate-tenant.use-case';
import { DeleteTenantUseCase } from '../application/use-cases/super-admin/delete-tenant.use-case';
import {
  TenantNotFoundError,
  TenantAlreadySuspendedError,
  TenantNotSuspendedError,
  TenantAlreadyRemovedError,
  AdminEmailAlreadyExistsError,
} from '../application/use-cases/super-admin/super-admin-errors';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { SuspendTenantDto } from './dto/suspend-tenant.dto';
import { DeleteTenantDto } from './dto/delete-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN' as any)
@Controller('super-admin')
export class SuperAdminController {
  constructor(
    private readonly listTenantsUseCase: ListTenantsUseCase,
    private readonly getTenantUseCase: GetTenantUseCase,
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly updateTenantUseCase: UpdateTenantUseCase,
    private readonly suspendTenantUseCase: SuspendTenantUseCase,
    private readonly reactivateTenantUseCase: ReactivateTenantUseCase,
    private readonly deleteTenantUseCase: DeleteTenantUseCase,
  ) {}

  // ── GET /super-admin/tenants ──────────────────────────────────────────────
  @Get('tenants')
  @ApiOperation({
    summary: 'Listar todos os tenants',
    description: 'Retorna lista paginada de tenants com filtros opcionais. Apenas SUPER_ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Lista de tenants paginada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas SUPER_ADMIN)' })
  async listTenants(@Query() query: ListTenantsQueryDto) {
    return this.listTenantsUseCase.execute(query);
  }

  // ── GET /super-admin/tenants/:id ──────────────────────────────────────────
  @Get('tenants/:id')
  @ApiOperation({ summary: 'Obter detalhes de um tenant' })
  @ApiParam({ name: 'id', description: 'ID do tenant' })
  @ApiResponse({ status: 200, description: 'Detalhes do tenant' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async getTenant(@Param('id') id: string) {
    try {
      return await this.getTenantUseCase.execute({ id });
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  // ── POST /super-admin/tenants ─────────────────────────────────────────────
  @Post('tenants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo tenant',
    description:
      'Cria um tenant com usuário admin. O admin recebe primeiroAcesso=true. ' +
      'Tenant + admin criados em transação atômica.',
  })
  @ApiResponse({ status: 201, description: 'Tenant criado com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail do admin já existe' })
  async createTenant(@Request() req, @Body() dto: CreateTenantDto) {
    try {
      return await this.createTenantUseCase.execute({
        superAdminId: req.user.userId,
        nome: dto.nome,
        plano: dto.plano,
        adminNome: dto.adminNome,
        adminEmail: dto.adminEmail,
        adminPassword: dto.adminPassword,
      });
    } catch (error) {
      if (error instanceof AdminEmailAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  // ── PATCH /super-admin/tenants/:id ────────────────────────────────────────
  @Patch('tenants/:id')
  @ApiOperation({ summary: 'Atualizar dados do tenant (nome, plano)' })
  @ApiParam({ name: 'id', description: 'ID do tenant' })
  @ApiResponse({ status: 200, description: 'Tenant atualizado' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async updateTenant(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    try {
      return await this.updateTenantUseCase.execute({
        superAdminId: req.user.userId,
        tenantId: id,
        nome: dto.nome,
        plano: dto.plano,
      });
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  // ── PATCH /super-admin/tenants/:id/suspend ────────────────────────────────
  @Patch('tenants/:id/suspend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Suspender tenant',
    description:
      'Suspende o tenant e invalida refresh tokens de todos os usuários imediatamente.',
  })
  @ApiParam({ name: 'id', description: 'ID do tenant' })
  @ApiResponse({ status: 204, description: 'Tenant suspenso com sucesso' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  @ApiResponse({ status: 409, description: 'Tenant já está suspenso' })
  async suspendTenant(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: SuspendTenantDto,
  ) {
    try {
      await this.suspendTenantUseCase.execute({
        superAdminId: req.user.userId,
        tenantId: id,
        motivo: dto.motivo,
      });
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof TenantAlreadySuspendedError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  // ── PATCH /super-admin/tenants/:id/reactivate ─────────────────────────────
  @Patch('tenants/:id/reactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reativar tenant suspenso' })
  @ApiParam({ name: 'id', description: 'ID do tenant' })
  @ApiResponse({ status: 204, description: 'Tenant reativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  @ApiResponse({ status: 409, description: 'Tenant não está suspenso' })
  async reactivateTenant(@Request() req, @Param('id') id: string) {
    try {
      await this.reactivateTenantUseCase.execute({
        superAdminId: req.user.userId,
        tenantId: id,
      });
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof TenantNotSuspendedError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  // ── DELETE /super-admin/tenants/:id ──────────────────────────────────────
  @Delete('tenants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover tenant (soft-delete)',
    description: 'Marca tenant como REMOVIDO. Operação irreversível via API.',
  })
  @ApiParam({ name: 'id', description: 'ID do tenant' })
  @ApiResponse({ status: 204, description: 'Tenant removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  @ApiResponse({ status: 409, description: 'Tenant já foi removido' })
  async deleteTenant(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: DeleteTenantDto,
  ) {
    try {
      await this.deleteTenantUseCase.execute({
        superAdminId: req.user.userId,
        tenantId: id,
        motivo: dto.motivo,
      });
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof TenantAlreadyRemovedError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
