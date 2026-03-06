import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SuspendTenantDto {
  @ApiPropertyOptional({ example: 'Inadimplência no pagamento do plano' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
