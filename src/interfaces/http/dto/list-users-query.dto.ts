import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersQueryDto {
  @ApiPropertyOptional({ description: 'Numero da pagina', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por pagina', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filtrar por role', enum: ['ADMIN', 'USER'] })
  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'USER'])
  role?: string;

  @ApiPropertyOptional({ description: 'Filtrar por status', enum: ['active', 'blocked'] })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'blocked'])
  status?: string;

  @ApiPropertyOptional({ description: 'Busca por nome ou email' })
  @IsOptional()
  @IsString()
  search?: string;
}
