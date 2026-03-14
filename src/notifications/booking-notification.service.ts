import { Injectable, Inject, Logger } from '@nestjs/common';
import { PushTokenRepository } from '../application/ports/push-token-repository';
import { PushNotificationService } from '../application/ports/push-notification.service';
import { PUSH_TOKEN_REPOSITORY, PUSH_NOTIFICATION_SERVICE } from './notifications.tokens';

export type BookingNotificationType =
  | 'new_booking'
  | 'booking_confirmed'
  | 'booking_cancelled';

const BOOKING_NOTIFICATIONS: Record<
  BookingNotificationType,
  { title: string; body: string }
> = {
  new_booking: {
    title: 'Nova reserva',
    body: 'Você recebeu uma nova solicitação de reserva',
  },
  booking_confirmed: {
    title: 'Reserva confirmada',
    body: 'Sua reserva foi aprovada pelo proprietário',
  },
  booking_cancelled: {
    title: 'Reserva cancelada',
    body: 'Sua reserva foi cancelada',
  },
};

@Injectable()
export class BookingNotificationService {
  private readonly logger = new Logger(BookingNotificationService.name);

  constructor(
    @Inject(PUSH_TOKEN_REPOSITORY)
    private readonly pushTokenRepository: PushTokenRepository,
    @Inject(PUSH_NOTIFICATION_SERVICE)
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  /**
   * Envia push notification de booking para um usuário.
   * Nunca lança exceção — best-effort.
   */
  async notify(
    userId: string,
    type: BookingNotificationType,
    bookingId: string,
  ): Promise<void> {
    try {
      const tokens = await this.pushTokenRepository.findByUserId(userId);
      if (tokens.length === 0) return;

      const notification = BOOKING_NOTIFICATIONS[type];

      await this.pushNotificationService.sendToMany(tokens, {
        title: notification.title,
        body: notification.body,
        data: {
          conversationId: `booking-${bookingId}`,
          type,
        },
        sound: 'default',
        badge: 1,
      });
    } catch (error) {
      this.logger.error(
        `Push notification error (booking ${type}): ${error.message}`,
      );
    }
  }
}
