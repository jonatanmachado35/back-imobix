import {
  IsString,
  IsEnum,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlanoEnum } from './create-tenant.dto';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Imobiliária Nova Praia' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string;

  @ApiPropertyOptional({ enum: PlanoEnum, example: PlanoEnum.PRO })
  @IsOptional()
  @IsEnum(PlanoEnum)
  plano?: PlanoEnum;
}
