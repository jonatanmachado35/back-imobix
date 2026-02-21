import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PropertyType, PropertyCategory } from '../../../domain/entities/property';

export class CreatePropertyDto {
  @ApiProperty({ enum: PropertyType, example: 'TEMPORADA' })
  @IsEnum(PropertyType)
  type: PropertyType;

  @ApiProperty({ example: 'Casa na Praia de Jurerê' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, example: 'Linda casa com vista para o mar' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 500000, description: 'Preço de venda ou aluguel mensal' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ required: false, example: 500, description: 'Preço por noite (temporada)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerNight?: number;

  @ApiProperty({ required: false, example: 800, description: 'Preço por noite em feriados' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  holidayPrice?: number;

  @ApiProperty({ required: false, example: 'Rua das Flores, 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, example: 'Florianópolis' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, example: 'Jurerê' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiProperty({ required: false, example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiProperty({ required: false, example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiProperty({ required: false, example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  parkingSpaces?: number;

  @ApiProperty({ required: false, example: 150.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @ApiProperty({ required: false, example: ['wifi', 'piscina', 'churrasqueira'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  petFriendly?: boolean;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  furnished?: boolean;

  @ApiProperty({ required: false, example: 2, description: 'Mínimo de noites (temporada)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minNights?: number;

  @ApiProperty({ required: false, example: 8, description: 'Máximo de hóspedes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxGuests?: number;

  @ApiProperty({ required: false, example: '14:00' })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiProperty({ required: false, example: '11:00' })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiProperty({ required: false, example: ['Não fumar', 'Sem festas'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  houseRules?: string[];

  @ApiProperty({ required: false, enum: PropertyCategory, example: 'PRAIA' })
  @IsOptional()
  @IsEnum(PropertyCategory)
  category?: PropertyCategory;
}

export class UpdatePropertyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerNight?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  petFriendly?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minNights?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxGuests?: number;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: ['activate', 'pause', 'remove'], example: 'pause' })
  @IsEnum(['activate', 'pause', 'remove'])
  action: 'activate' | 'pause' | 'remove';
}
