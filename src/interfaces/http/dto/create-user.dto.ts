import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRoleDto {
  CLIENTE = 'cliente',
  PROPRIETARIO = 'proprietario',
}

export class CreateUserDto {
  @ApiProperty({ description: 'Nome completo do usuário', example: 'Maria Silva' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Email do usuário', example: 'maria@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha do usuário (mínimo 8 caracteres)', example: 'senha123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    enum: UserRoleDto,
    example: 'cliente',
    description: 'Tipo de usuário: cliente ou proprietario'
  })
  @IsEnum(UserRoleDto)
  userRole: UserRoleDto;
}
