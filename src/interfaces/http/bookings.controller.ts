import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
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
import { CreateBookingUseCase } from '../../application/use-cases/bookings/create-booking.use-case';
import { CancelBookingUseCase } from '../../application/use-cases/bookings/cancel-booking.use-case';
import { ListBookingsUseCase } from '../../application/use-cases/bookings/list-bookings.use-case';
import { BookingNotificationService } from '../../notifications/booking-notification.service';
import {
  CreateBookingDto,
  CancelBookingDto,
  BookingResponseDto,
} from './dto/booking.dto';
import { BookingMapper } from './mappers/booking.mapper';

@ApiTags('Reservas')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
    private readonly listBookingsUseCase: ListBookingsUseCase,
    private readonly bookingNotificationService: BookingNotificationService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar nova reserva' })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  @ApiResponse({ status: 409, description: 'Datas indisponíveis' })
  async create(
    @Body() dto: CreateBookingDto,
    @Request() req: any,
  ): Promise<BookingResponseDto> {
    const booking = await this.createBookingUseCase.execute({
      propertyId: dto.propertyId,
      guestId: req.user.userId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      adults: dto.adults,
      children: dto.children,
      message: dto.message,
    });

    // Notifica o proprietário sobre nova reserva (best-effort)
    await this.bookingNotificationService.notify(
      booking.ownerId,
      'new_booking',
      booking.id,
    );

    return BookingMapper.toResponseDto(booking);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar minhas reservas (como hóspede)' })
  @ApiResponse({ status: 200, type: [BookingResponseDto] })
  async listMyBookings(@Request() req: any): Promise<BookingResponseDto[]> {
    const bookings = await this.listBookingsUseCase.execute({
      userId: req.user.userId,
      role: 'guest',
    });
    return bookings.map((b) => BookingMapper.toResponseDto(b));
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar reserva' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @Request() req: any,
  ): Promise<BookingResponseDto> {
    const booking = await this.cancelBookingUseCase.execute({
      bookingId: id,
      userId: req.user.userId,
      reason: dto.reason,
    });

    // Notifica o hóspede sobre cancelamento (best-effort)
    await this.bookingNotificationService.notify(
      booking.guestId,
      'booking_cancelled',
      booking.id,
    );

    return BookingMapper.toResponseDto(booking);
  }
}
