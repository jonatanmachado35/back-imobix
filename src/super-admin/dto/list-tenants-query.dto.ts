import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TenantStatusEnum {
  ATIVO = 'ATIVO',
  SUSPENSO = 'SUSPENSO',
  REMOVIDO = 'REMOVIDO',
}

export class ListTenantsQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ enum: TenantStatusEnum })
  @IsOptional()
  @IsEnum(TenantStatusEnum)
  status?: TenantStatusEnum;

  @ApiPropertyOptional({ example: 'Beira Mar' })
  @IsOptional()
  @IsString()
  search?: string;
}
