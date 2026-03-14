export type PushNotificationPayload = {
  /** Token Expo do destinatário: ExponentPushToken[...] */
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  badge?: number;
};

export abstract class PushNotificationService {
  /**
   * Envia notificação para um único token.
   */
  abstract send(payload: PushNotificationPayload): Promise<void>;

  /**
   * Envia notificações em lote (até 100 por chamada, conforme limite da Expo API).
   */
  abstract sendBatch(payloads: PushNotificationPayload[]): Promise<void>;

  /**
   * Envia a mesma notificação para múltiplos tokens.
   * Internamente faz batching automático de 100.
   */
  abstract sendToMany(
    tokens: string[],
    notification: Omit<PushNotificationPayload, 'to'>,
  ): Promise<void>;
}
