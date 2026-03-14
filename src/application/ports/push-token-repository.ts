export interface PushTokenRepository {
  /**
   * Salva o push token para o usuário.
   * Se o token já existir (UNIQUE), não duplica — apenas ignora.
   * Suporte a múltiplos dispositivos por usuário.
   */
  save(userId: string, token: string, platform?: string): Promise<void>;

  /**
   * Retorna todos os tokens ativos de um usuário (um por dispositivo).
   */
  findByUserId(userId: string): Promise<string[]>;

  /**
   * Retorna todos os tokens de uma lista de userIds.
   * Útil para notificar múltiplos usuários em batch.
   */
  findByUserIds(userIds: string[]): Promise<string[]>;

  /**
   * Remove um token inválido/expirado reportado pela Expo API.
   */
  deleteByToken(token: string): Promise<void>;
}
