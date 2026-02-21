import { Body, ConflictException, Controller, Get, NotFoundException, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { GetUserProfileUseCase, UserNotFoundError as GetUserNotFoundError } from '../../application/use-cases/get-user-profile.use-case';
import { UpdateUserProfileUseCase, UserNotFoundError as UpdateUserNotFoundError } from '../../application/use-cases/update-user-profile.use-case';
import { EmailAlreadyExistsError } from '../../application/use-cases/user-errors';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly getUserProfile: GetUserProfileUseCase,
    private readonly updateUserProfile: UpdateUserProfileUseCase
  ) { }

  @Post()
  @ApiOperation({
    summary: 'Auto-registro de usuário',
    description: 'Endpoint público para qualquer pessoa se cadastrar como cliente ou proprietário (sem autenticação automática)'
  })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async create(@Body() dto: CreateUserDto) {
    try {
      const user = await this.createUser.execute({
        nome: dto.nome,
        email: dto.email,
        password: dto.password,
        userRole: dto.userRole
      });
      return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        userType: user.userRole || 'cliente',
        createdAt: user.createdAt
      };
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário', description: 'Retorna dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getMe(@Request() req) {
    try {
      return await this.getUserProfile.execute(req.user.userId);
    } catch (error) {
      if (error instanceof GetUserNotFoundError) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil', description: 'Atualiza dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async updateMe(@Request() req, @Body() dto: UpdateProfileDto) {
    try {
      return await this.updateUserProfile.execute(req.user.userId, dto);
    } catch (error) {
      if (error instanceof UpdateUserNotFoundError) {
        throw new NotFoundException('User not found');
      }
      if (error instanceof EmailAlreadyExistsError) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }
}
