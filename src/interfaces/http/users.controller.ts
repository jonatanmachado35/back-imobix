import { Body, ConflictException, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { EmailAlreadyExistsError } from '../../application/use-cases/user-errors';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(private readonly createUser: CreateUserUseCase) { }

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário', description: 'Registra um novo usuário no sistema' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async create(@Body() dto: CreateUserDto) {
    try {
      const user = await this.createUser.execute(dto);
      return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        createdAt: user.createdAt
      };
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }
}
