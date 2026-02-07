import { IsString, IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'property-uuid' })
  @IsString()
  propertyId: string;

  @ApiProperty({ example: '2025-03-01' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2025-03-05' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  adults: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  children: number;

  @ApiPropertyOptional({ example: 'Looking forward to my stay!' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ example: 'Changed my travel plans' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BookingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  propertyId: string;

  @ApiProperty()
  guestId: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  checkIn: string;

  @ApiProperty()
  checkOut: string;

  @ApiProperty()
  guests: number;

  @ApiProperty()
  adults: number;

  @ApiProperty()
  children: number;

  @ApiProperty()
  totalNights: number;

  @ApiProperty()
  pricePerNight: number;

  @ApiProperty()
  cleaningFee: number;

  @ApiProperty()
  serviceFee: number;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty({ enum: ['PENDENTE', 'CONFIRMADA', 'CANCELADA', 'CONCLUIDA'] })
  status: string;

  @ApiPropertyOptional()
  message?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class OwnerDashboardResponseDto {
  @ApiProperty({ example: 5 })
  totalProperties: number;

  @ApiProperty({ example: 3 })
  pendingBookings: number;

  @ApiProperty({ example: 2 })
  confirmedBookings: number;

  @ApiProperty({ example: 10 })
  completedBookings: number;

  @ApiProperty({ example: 15000.50 })
  totalRevenue: number;

  @ApiProperty({ type: [BookingResponseDto] })
  recentBookings: BookingResponseDto[];
}
