import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ListActivitiesUseCase } from '../../application/use-cases/activities/list-activities.use-case';
import { Activity } from '../../domain/entities/activity';

class ActivityResponseDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  description?: string;
  propertyId?: string;
  bookingId?: string;
  createdAt: string;
}

@ApiTags('Atividades')
@Controller('activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivitiesController {
  constructor(private readonly listActivitiesUseCase: ListActivitiesUseCase) { }

  private toResponseDto(activity: Activity): ActivityResponseDto {
    return {
      id: activity.id,
      userId: activity.userId,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      propertyId: activity.propertyId,
      bookingId: activity.bookingId,
      createdAt: activity.createdAt.toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar histórico de atividades' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, type: [ActivityResponseDto] })
  async list(
    @Request() req: any,
    @Query('limit') limit?: string,
  ): Promise<ActivityResponseDto[]> {
    const activities = await this.listActivitiesUseCase.execute({
      userId: req.user.userId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return activities.map((a) => this.toResponseDto(a));
  }
}
