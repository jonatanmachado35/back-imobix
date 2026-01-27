import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventResponseDto } from './dto/event-response.dto';

@ApiTags('Calendário')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calendario')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) { }

  @Get('eventos')
  @ApiOperation({ summary: 'Listar eventos do calendário', description: 'Retorna eventos agendados (visitas, reuniões, etc) em um período' })
  @ApiQuery({ name: 'inicio', required: true, description: 'Data inicial (formato ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  @ApiQuery({ name: 'fim', required: true, description: 'Data final (formato ISO 8601)', example: '2026-01-31T23:59:59.999Z' })
  @ApiResponse({ status: 200, description: 'Lista de eventos retornada com sucesso', type: [EventResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  getEvents(@Query('inicio') start: string, @Query('fim') end: string) {
    return this.calendarService.getEvents(start, end);
  }
}
