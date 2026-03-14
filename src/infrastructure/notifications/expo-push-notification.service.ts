import { Injectable, Logger } from '@nestjs/common';
import {
  PushNotificationPayload,
  PushNotificationService,
} from '../../application/ports/push-notification.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_LIMIT = 100;

@Injectable()
export class ExpoPushNotificationService extends PushNotificationService {
  private readonly logger = new Logger(ExpoPushNotificationService.name);

  async send(payload: PushNotificationPayload): Promise<void> {
    await this.sendBatch([payload]);
  }

  async sendBatch(payloads: PushNotificationPayload[]): Promise<void> {
    if (payloads.length === 0) return;

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          payloads.map((p) => ({
            to: p.to,
            title: p.title,
            body: p.body,
            data: p.data ?? {},
            sound: p.sound ?? 'default',
            badge: p.badge ?? 1,
          })),
        ),
      });

      if (!response.ok) {
        this.logger.error(
          `Expo Push API error: ${response.status} ${response.statusText}`,
        );
        return;
      }

      const result = (await response.json()) as { data: ExpoTicket[] };

      // Loga tickets com erro para monitoramento (não lança exceção — best-effort)
      result.data?.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          this.logger.warn(
            `Push ticket error for token ${payloads[index]?.to}: ${ticket.message} (${ticket.details?.error})`,
          );
        }
      });
    } catch (error) {
      // Notificações são best-effort — nunca deixam a operação principal falhar
      this.logger.error(`Failed to send push notification: ${error.message}`);
    }
  }

  async sendToMany(
    tokens: string[],
    notification: Omit<PushNotificationPayload, 'to'>,
  ): Promise<void> {
    if (tokens.length === 0) return;

    // Batching automático respeitando o limite de 100 da Expo API
    const batches: string[][] = [];
    for (let i = 0; i < tokens.length; i += EXPO_BATCH_LIMIT) {
      batches.push(tokens.slice(i, i + EXPO_BATCH_LIMIT));
    }

    const payloads = tokens.map((token) => ({ to: token, ...notification }));

    await Promise.all(
      batches.map((batch) => {
        const batchPayloads = batch.map((token) => ({
          to: token,
          ...notification,
        }));
        return this.sendBatch(batchPayloads);
      }),
    );
  }
}

// ——— Tipos internos da Expo Push API ———
interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded';
  };
}
