import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsEmail, MinLength } from 'class-validator';

export class CreateFuncionarioDto {
  @ApiProperty({ description: 'Nome completo do funcionário', example: 'Maria Santos' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Email do funcionário', example: 'maria.santos@imobix.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha do funcionário', example: 'senha123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'CPF do funcionário', example: '987.654.321-00', required: false })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({ description: 'Telefone do funcionário', example: '(11) 91234-5678', required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ 
    description: 'Status do funcionário', 
    enum: ['ATIVO', 'INATIVO'], 
    example: 'ATIVO',
    default: 'ATIVO',
    required: false 
  })
  @IsOptional()
  @IsEnum(['ATIVO', 'INATIVO'])
  status?: 'ATIVO' | 'INATIVO';

  @ApiProperty({ description: 'Endereço do funcionário', example: 'Rua das Flores, 123', required: false })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiProperty({ description: 'Departamento do funcionário', example: 'TI', required: false })
  @IsOptional()
  @IsString()
  departamento?: string;
}
