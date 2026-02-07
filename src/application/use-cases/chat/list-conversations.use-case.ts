import { ConversationRepository } from '../../ports/conversation-repository';
import { Conversation } from '../../../domain/entities/conversation';

export class ListConversationsUseCase {
  constructor(private readonly conversationRepository: ConversationRepository) { }

  async execute(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.findByUserId(userId);
  }
}
