import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateCorretorDto {
  @ApiProperty({ description: 'Nome completo do corretor', example: 'Carlos Eduardo Silva', required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ description: 'Número CRECI do corretor', example: 'F12345', required: false })
  @IsOptional()
  @IsString()
  creci?: string;

  @ApiProperty({ description: 'Especialidade do corretor', example: 'Imóveis de alto padrão', required: false })
  @IsOptional()
  @IsString()
  especialidade?: string;
}
