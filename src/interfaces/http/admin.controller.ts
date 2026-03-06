import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ListUsersUseCase } from '../../application/use-cases/admin/list-users.use-case';
import { PromoteToAdminUseCase } from '../../application/use-cases/admin/promote-to-admin.use-case';
import { BlockUserUseCase } from '../../application/use-cases/admin/block-user.use-case';
import { UnblockUserUseCase } from '../../application/use-cases/admin/unblock-user.use-case';
import { UserNotFoundError } from '../../application/use-cases/user-errors';
import {
  UserAlreadyAdminError,
  UserAlreadyBlockedError,
  UserNotBlockedError,
  CannotBlockAdminError,
  CannotPromoteBlockedUserError,
  TenantMismatchError,
} from '../../application/use-cases/admin/admin-errors';
import { resolveUserType } from '../../application/use-cases/login.use-case';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import {
  ListUsersResponseDto,
  PromoteResponseDto,
  BlockResponseDto,
  UnblockResponseDto,
} from './dto/admin-action-response.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/users')
export class AdminController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly promoteToAdminUseCase: PromoteToAdminUseCase,
    private readonly blockUserUseCase: BlockUserUseCase,
    private readonly unblockUserUseCase: UnblockUserUseCase,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios',
    description: 'Admin lista todos os usuarios do sistema com filtros e paginacao',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios', type: ListUsersResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao (nao eh admin)' })
  async listUsers(@Query() query: ListUsersQueryDto, @Request() req): Promise<ListUsersResponseDto> {
    const result = await this.listUsersUseCase.execute({
      page: query.page,
      limit: query.limit,
      role: query.role,
      status: query.status,
      search: query.search,
      // SUPER_ADMIN (tenantId=null) vê todos os tenants; ADMIN vê apenas o próprio tenant (ADR-001)
      tenantId: req.user.tenantId ?? undefined,
    });

    return {
      data: result.data.map((user) => ({
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        userRole: resolveUserType(user.role, user.userRole),
        status: user.status === 'BLOCKED' ? 'blocked' : 'active',
        createdAt: user.createdAt,
      })),
      meta: result.meta,
    };
  }

  @Patch(':userId/promote')
  @ApiOperation({
    summary: 'Promover usuario a admin',
    description: 'Promove um USER para ADMIN',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuario a ser promovido' })
  @ApiResponse({ status: 200, description: 'Usuario promovido', type: PromoteResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  @ApiResponse({ status: 404, description: 'Usuario nao encontrado' })
  @ApiResponse({ status: 409, description: 'Usuario ja eh admin' })
  @ApiResponse({ status: 422, description: 'Usuario esta bloqueado' })
  async promoteToAdmin(
    @Param('userId') userId: string,
    @Request() req,
  ): Promise<PromoteResponseDto> {
    try {
      return await this.promoteToAdminUseCase.execute({
        adminId: req.user.userId,
        targetUserId: userId,
        tenantId: req.user.tenantId ?? null,
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException('Usuario nao encontrado');
      }
      if (error instanceof TenantMismatchError) {
        throw new ForbiddenException('Operacao nao permitida: usuario pertence a outro tenant');
      }
      if (error instanceof UserAlreadyAdminError) {
        throw new ConflictException('Usuario ja eh admin');
      }
      if (error instanceof CannotPromoteBlockedUserError) {
        throw new UnprocessableEntityException('Usuario esta bloqueado');
      }
      throw error;
    }
  }

  @Patch(':userId/block')
  @ApiOperation({
    summary: 'Bloquear usuario',
    description: 'Bloqueia um USER impedindo login',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuario a ser bloqueado' })
  @ApiResponse({ status: 200, description: 'Usuario bloqueado', type: BlockResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  @ApiResponse({ status: 404, description: 'Usuario nao encontrado' })
  @ApiResponse({ status: 409, description: 'Usuario ja esta bloqueado' })
  @ApiResponse({ status: 422, description: 'Nao eh possivel bloquear um admin' })
  async blockUser(
    @Param('userId') userId: string,
    @Request() req,
  ): Promise<BlockResponseDto> {
    try {
      return await this.blockUserUseCase.execute({
        adminId: req.user.userId,
        targetUserId: userId,
        tenantId: req.user.tenantId ?? null,
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException('Usuario nao encontrado');
      }
      if (error instanceof TenantMismatchError) {
        throw new ForbiddenException('Operacao nao permitida: usuario pertence a outro tenant');
      }
      if (error instanceof CannotBlockAdminError) {
        throw new UnprocessableEntityException('Nao eh possivel bloquear um admin');
      }
      if (error instanceof UserAlreadyBlockedError) {
        throw new ConflictException('Usuario ja esta bloqueado');
      }
      throw error;
    }
  }

  @Patch(':userId/unblock')
  @ApiOperation({
    summary: 'Desbloquear usuario',
    description: 'Desbloqueia um usuario permitindo login novamente',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuario a ser desbloqueado' })
  @ApiResponse({ status: 200, description: 'Usuario desbloqueado', type: UnblockResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  @ApiResponse({ status: 404, description: 'Usuario nao encontrado' })
  @ApiResponse({ status: 409, description: 'Usuario nao esta bloqueado' })
  async unblockUser(
    @Param('userId') userId: string,
    @Request() req,
  ): Promise<UnblockResponseDto> {
    try {
      return await this.unblockUserUseCase.execute({
        adminId: req.user.userId,
        targetUserId: userId,
        tenantId: req.user.tenantId ?? null,
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException('Usuario nao encontrado');
      }
      if (error instanceof TenantMismatchError) {
        throw new ForbiddenException('Operacao nao permitida: usuario pertence a outro tenant');
      }
      if (error instanceof UserNotBlockedError) {
        throw new ConflictException('Usuario nao esta bloqueado');
      }
      throw error;
    }
  }
}
