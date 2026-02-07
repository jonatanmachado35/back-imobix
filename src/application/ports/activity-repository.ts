import { ActivityType } from '../../domain/entities/activity';

export interface CreateActivityData {
  userId: string;
  type: ActivityType | string;
  title: string;
  description?: string;
  propertyId?: string;
  bookingId?: string;
}

export interface ActivityFilters {
  userId?: string;
  type?: ActivityType;
  limit?: number;
}

export interface ActivityRepository {
  findByUser(userId: string, limit?: number): Promise<any[]>;
  create(data: CreateActivityData): Promise<any>;
}
