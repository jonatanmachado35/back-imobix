import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PlanoEnum {
  BASICO = 'BASICO',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export class CreateTenantDto {
  @ApiProperty({ example: 'Imobiliária Beira Mar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nome: string;

  @ApiProperty({ enum: PlanoEnum, example: PlanoEnum.BASICO })
  @IsEnum(PlanoEnum)
  plano: PlanoEnum;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  adminNome: string;

  @ApiProperty({ example: 'joao@imobiliaria.com' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  adminPassword: string;
}
