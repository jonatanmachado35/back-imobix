import { Injectable } from '@nestjs/common';
import { PushTokenRepository } from '../../application/ports/push-token-repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaPushTokenRepository implements PushTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, token: string, platform?: string): Promise<void> {
    // upsert garante idempotência: se token já existe, não duplica
    await (this.prisma.userPushToken as any).upsert({
      where: { token },
      update: {}, // nada a atualizar — token já existe e é do mesmo usuário
      create: {
        userId,
        token,
        platform: platform ?? null,
      },
    });
  }

  async findByUserId(userId: string): Promise<string[]> {
    const records = await (this.prisma.userPushToken as any).findMany({
      where: { userId },
      select: { token: true },
    });
    return records.map((r: { token: string }) => r.token);
  }

  async findByUserIds(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];

    const records = await (this.prisma.userPushToken as any).findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });
    return records.map((r: { token: string }) => r.token);
  }

  async deleteByToken(token: string): Promise<void> {
    await (this.prisma.userPushToken as any).deleteMany({
      where: { token },
    });
  }
}
