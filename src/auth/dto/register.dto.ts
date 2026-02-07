import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRoleDto {
  CLIENTE = 'cliente',
  PROPRIETARIO = 'proprietario',
}

export class RegisterDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome completo do usuário' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao@email.com', description: 'E-mail do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha1234', minLength: 8, description: 'Senha com mínimo de 8 caracteres' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRoleDto, example: 'cliente', description: 'Tipo de usuário' })
  @IsEnum(UserRoleDto)
  role: UserRoleDto;
}
