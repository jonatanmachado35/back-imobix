import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsNumber, Min } from 'class-validator';

export class CreateCorretorDto {
  @ApiProperty({ description: 'Nome completo do corretor', example: 'Carlos Eduardo Silva' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Número CRECI do corretor', example: 'F12345', required: false })
  @IsOptional()
  @IsString()
  creci?: string;

  @ApiProperty({ description: 'Especialidade do corretor', example: 'Imóveis de alto padrão', required: false })
  @IsOptional()
  @IsString()
  especialidade?: string;

  @ApiProperty({ description: 'ID do usuário vinculado (se houver)', example: 'clxyz123456789', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}
