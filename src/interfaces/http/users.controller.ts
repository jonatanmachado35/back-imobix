import { Body, ConflictException, Controller, Post } from '@nestjs/common';
import {
  CreateUserUseCase,
  EmailAlreadyExistsError
} from '../../application/use-cases/create-user.use-case';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly createUser: CreateUserUseCase) { }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    try {
      const user = await this.createUser.execute(dto);
      return {
        id: user.id,
        name: user.nome,
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
