import { MessageRepository } from '../../ports/message-repository';
import { ConversationRepository } from '../../ports/conversation-repository';
import { Message } from '../../../domain/entities/message';

export interface ListMessagesInput {
  conversationId: string;
  userId: string;
  before?: string;
  limit?: number;
}

export class ListMessagesUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
  ) { }

  async execute(input: ListMessagesInput): Promise<Message[]> {
    const { conversationId, userId, before, limit = 50 } = input;

    // Find conversation
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check authorization
    if (!conversation.isParticipant(userId)) {
      throw new Error('Not authorized to view this conversation');
    }

    // Get messages
    return this.messageRepository.findByConversationId(conversationId, {
      before,
      limit,
    });
  }
}
