import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ConfirmBookingUseCase } from '../../application/use-cases/bookings/confirm-booking.use-case';
import { CancelBookingUseCase } from '../../application/use-cases/bookings/cancel-booking.use-case';
import { ListBookingsUseCase } from '../../application/use-cases/bookings/list-bookings.use-case';
import { GetOwnerDashboardUseCase } from '../../application/use-cases/bookings/get-owner-dashboard.use-case';
import {
  BookingResponseDto,
  OwnerDashboardResponseDto,
} from './dto/booking.dto';
import { BookingMapper } from './mappers/booking.mapper';

@ApiTags('Proprietário - Reservas')
@Controller('proprietario')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OwnerBookingsController {
  constructor(
    private readonly confirmBookingUseCase: ConfirmBookingUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
    private readonly listBookingsUseCase: ListBookingsUseCase,
    private readonly getOwnerDashboardUseCase: GetOwnerDashboardUseCase,
  ) { }

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter dashboard do proprietário' })
  @ApiResponse({ status: 200, type: OwnerDashboardResponseDto })
  async getDashboard(@Request() req: any): Promise<OwnerDashboardResponseDto> {
    const dashboard = await this.getOwnerDashboardUseCase.execute({
      ownerId: req.user.userId,
    });
    return {
      totalProperties: dashboard.totalProperties,
      pendingBookings: dashboard.pendingBookings,
      confirmedBookings: dashboard.confirmedBookings,
      completedBookings: dashboard.completedBookings,
      totalRevenue: dashboard.totalRevenue,
      recentBookings: dashboard.recentBookings.map((b) => BookingMapper.toResponseDto(b)),
    };
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Listar reservas dos meus imóveis' })
  @ApiResponse({ status: 200, type: [BookingResponseDto] })
  async listOwnerBookings(@Request() req: any): Promise<BookingResponseDto[]> {
    const bookings = await this.listBookingsUseCase.execute({
      userId: req.user.userId,
      role: 'owner',
    });
    return bookings.map((b) => BookingMapper.toResponseDto(b));
  }

  @Patch('bookings/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar reserva' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada' })
  async confirmBooking(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<BookingResponseDto> {
    const booking = await this.confirmBookingUseCase.execute({
      bookingId: id,
      ownerId: req.user.userId,
    });
    return BookingMapper.toResponseDto(booking);
  }

  @Patch('bookings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar reserva (como proprietário)' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada' })
  async cancelBooking(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<BookingResponseDto> {
    const booking = await this.cancelBookingUseCase.execute({
      bookingId: id,
      userId: req.user.userId,
      reason: 'Cancelado pelo proprietário',
    });
    return BookingMapper.toResponseDto(booking);
  }
}
