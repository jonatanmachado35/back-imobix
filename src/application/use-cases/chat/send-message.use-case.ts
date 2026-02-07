import { MessageRepository } from '../../ports/message-repository';
import { ConversationRepository } from '../../ports/conversation-repository';
import { Message, SenderRole } from '../../../domain/entities/message';

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  text: string;
}

export class SendMessageUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
  ) { }

  async execute(input: SendMessageInput): Promise<Message> {
    const { conversationId, senderId, text } = input;

    // Validate text
    if (!text || text.trim().length === 0) {
      throw new Error('Message text cannot be empty');
    }

    // Find conversation
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check authorization
    if (!conversation.isParticipant(senderId)) {
      throw new Error('Not authorized to send message');
    }

    // Determine sender role
    const senderRole =
      senderId === conversation.clientId
        ? SenderRole.CLIENTE
        : SenderRole.PROPRIETARIO;

    // Create message
    const message = await this.messageRepository.create({
      conversationId,
      senderId,
      senderRole,
      text,
    });

    // Update conversation lastMessage
    await this.conversationRepository.updateLastMessage(conversationId, text);

    return message;
  }
}
