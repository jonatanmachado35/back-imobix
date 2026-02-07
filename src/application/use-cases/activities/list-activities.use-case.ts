import { Activity } from '../../../domain/entities/activity';
import { ActivityRepository } from '../../ports/activity-repository';

export interface ListActivitiesInput {
  userId: string;
  limit?: number;
}

export class ListActivitiesUseCase {
  constructor(private readonly activityRepository: ActivityRepository) { }

  async execute(input: ListActivitiesInput): Promise<Activity[]> {
    return this.activityRepository.findByUser(input.userId, input.limit);
  }
}
