import { ListActivitiesUseCase } from './list-activities.use-case';
import { Activity, ActivityType } from '../../../domain/entities/activity';
import { ActivityRepository, CreateActivityData } from '../../ports/activity-repository';

// In-memory repository for testing
class InMemoryActivityRepository implements ActivityRepository {
  private activities: Activity[] = [];

  async findByUser(userId: string, limit?: number): Promise<Activity[]> {
    const userActivities = this.activities
      .filter((a) => a.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return limit ? userActivities.slice(0, limit) : userActivities;
  }

  async create(data: CreateActivityData): Promise<Activity> {
    const activity = new Activity({
      id: `activity-${this.activities.length + 1}`,
      userId: data.userId,
      type: data.type as ActivityType,
      title: data.title,
      description: data.description,
      propertyId: data.propertyId,
      bookingId: data.bookingId,
      createdAt: new Date(),
    });
    this.activities.push(activity);
    return activity;
  }

  addActivity(activity: Activity): void {
    this.activities.push(activity);
  }
}

describe('ListActivitiesUseCase', () => {
  let useCase: ListActivitiesUseCase;
  let repository: InMemoryActivityRepository;

  beforeEach(() => {
    repository = new InMemoryActivityRepository();
    useCase = new ListActivitiesUseCase(repository);
  });

  const createActivity = (id: string, userId: string, type: ActivityType, daysAgo: number = 0): Activity => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return new Activity({
      id,
      userId,
      type,
      title: `Activity ${id}`,
      description: 'Test activity',
      createdAt: date,
    });
  };

  it('should return activities for a user', async () => {
    repository.addActivity(createActivity('1', 'user-1', ActivityType.RESERVA_CRIADA));
    repository.addActivity(createActivity('2', 'user-1', ActivityType.FAVORITO_ADICIONADO));
    repository.addActivity(createActivity('3', 'user-2', ActivityType.RESERVA_CRIADA));

    const activities = await useCase.execute({ userId: 'user-1' });

    expect(activities).toHaveLength(2);
    expect(activities.every((a) => a.userId === 'user-1')).toBe(true);
  });

  it('should return activities sorted by most recent first', async () => {
    repository.addActivity(createActivity('old', 'user-1', ActivityType.RESERVA_CRIADA, 5));
    repository.addActivity(createActivity('new', 'user-1', ActivityType.FAVORITO_ADICIONADO, 1));
    repository.addActivity(createActivity('newest', 'user-1', ActivityType.RESERVA_CONFIRMADA, 0));

    const activities = await useCase.execute({ userId: 'user-1' });

    expect(activities[0].id).toBe('newest');
    expect(activities[1].id).toBe('new');
    expect(activities[2].id).toBe('old');
  });

  it('should return empty array for user with no activities', async () => {
    const activities = await useCase.execute({ userId: 'user-no-activities' });
    expect(activities).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    // Add 10 activities
    for (let i = 1; i <= 10; i++) {
      repository.addActivity(createActivity(`${i}`, 'user-1', ActivityType.RESERVA_CRIADA, i));
    }

    const activities = await useCase.execute({ userId: 'user-1', limit: 5 });

    expect(activities).toHaveLength(5);
  });
});
