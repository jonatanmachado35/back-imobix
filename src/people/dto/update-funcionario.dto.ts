import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateFuncionarioDto {
  @ApiProperty({ description: 'CPF do funcionário', example: '123.456.789-00', required: false })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({ description: 'Telefone do funcionário', example: '11987654321', required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ 
    description: 'Status do funcionário', 
    enum: ['ATIVO', 'INATIVO'], 
    example: 'ATIVO',
    required: false 
  })
  @IsOptional()
  @IsEnum(['ATIVO', 'INATIVO'])
  status?: 'ATIVO' | 'INATIVO';
}
