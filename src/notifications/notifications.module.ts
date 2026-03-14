import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PUSH_TOKEN_REPOSITORY, PUSH_NOTIFICATION_SERVICE } from './notifications.tokens';
import { PrismaPushTokenRepository } from '../infrastructure/database/prisma-push-token.repository';
import { ExpoPushNotificationService } from '../infrastructure/notifications/expo-push-notification.service';
import { SavePushTokenUseCase } from '../application/use-cases/push-notifications/save-push-token.use-case';
import { BookingNotificationService } from './booking-notification.service';
import { PushTokenRepository } from '../application/ports/push-token-repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    { provide: PUSH_TOKEN_REPOSITORY, useClass: PrismaPushTokenRepository },
    { provide: PUSH_NOTIFICATION_SERVICE, useClass: ExpoPushNotificationService },
    {
      provide: SavePushTokenUseCase,
      useFactory: (repo: PushTokenRepository) => new SavePushTokenUseCase(repo),
      inject: [PUSH_TOKEN_REPOSITORY],
    },
    BookingNotificationService,
  ],
  exports: [
    PUSH_TOKEN_REPOSITORY,
    PUSH_NOTIFICATION_SERVICE,
    SavePushTokenUseCase,
    BookingNotificationService,
  ],
})
export class NotificationsModule {}
