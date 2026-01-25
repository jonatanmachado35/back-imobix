import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({ description: 'Nome do lead', example: 'João Silva' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Email do lead', example: 'joao@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Telefone do lead', example: '11999999999', required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ description: 'Origem do lead', example: 'Website', required: false })
  @IsOptional()
  @IsString()
  origem?: string;

  @ApiProperty({ description: 'Interesse do lead', example: 'Apartamento 2 quartos', required: false })
  @IsOptional()
  @IsString()
  interesse?: string;

  @ApiProperty({ description: 'Anotações sobre o lead', example: 'Cliente interessado em zona sul', required: false })
  @IsOptional()
  @IsString()
  anotacoes?: string;
}
