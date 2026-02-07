import { Conversation } from '../../domain/entities/conversation';

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findByPropertyAndClient(
    propertyId: string,
    clientId: string,
  ): Promise<Conversation | null>;
  findByUserId(userId: string): Promise<Conversation[]>;
  create(data: {
    propertyId: string;
    clientId: string;
    ownerId: string;
  }): Promise<Conversation>;
  updateLastMessage(id: string, text: string): Promise<Conversation>;
}
