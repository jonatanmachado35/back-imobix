import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteTenantDto {
  @ApiPropertyOptional({ example: 'Solicitação do cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
