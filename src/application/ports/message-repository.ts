import { Message, MessageStatus, SenderRole } from '../../domain/entities/message';

export interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  senderRole: SenderRole;
  text: string;
}

export interface MessageRepository {
  findById(id: string): Promise<Message | null>;
  findByConversationId(
    conversationId: string,
    options?: {
      before?: string;
      limit?: number;
    },
  ): Promise<Message[]>;
  create(data: CreateMessageInput): Promise<Message>;
  updateStatus(id: string, status: MessageStatus): Promise<Message>;
  markAsRead(
    conversationId: string,
    lastMessageId: string,
    userId: string,
  ): Promise<void>;
}
