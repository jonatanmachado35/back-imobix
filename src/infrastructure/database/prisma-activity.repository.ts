import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Activity, ActivityType } from '../../domain/entities/activity';
import { ActivityRepository, CreateActivityData } from '../../application/ports/activity-repository';
import { ActivityType as PrismaActivityType } from '@prisma/client';

@Injectable()
export class PrismaActivityRepository implements ActivityRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByUser(userId: string, limit?: number): Promise<Activity[]> {
    const activities = await this.prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities.map((a) => new Activity({
      id: a.id,
      userId: a.userId,
      type: a.type as ActivityType,
      title: a.title,
      description: a.description ?? undefined,
      propertyId: a.propertyId ?? undefined,
      bookingId: a.bookingId ?? undefined,
      createdAt: a.createdAt,
    }));
  }

  async create(data: CreateActivityData): Promise<Activity> {
    const activity = await this.prisma.activity.create({
      data: {
        userId: data.userId,
        type: data.type as PrismaActivityType,
        title: data.title,
        description: data.description,
        propertyId: data.propertyId,
        bookingId: data.bookingId,
      },
    });

    return new Activity({
      id: activity.id,
      userId: activity.userId,
      type: activity.type as ActivityType,
      title: activity.title,
      description: activity.description ?? undefined,
      propertyId: activity.propertyId ?? undefined,
      bookingId: activity.bookingId ?? undefined,
      createdAt: activity.createdAt,
    });
  }
}
