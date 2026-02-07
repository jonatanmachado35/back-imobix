import { ConversationRepository } from '../../ports/conversation-repository';
import { PropertyRepository } from '../../ports/property-repository';
import { Conversation } from '../../../domain/entities/conversation';

export interface GetOrCreateConversationInput {
  propertyId: string;
  clientId: string;
}

export class GetOrCreateConversationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly propertyRepository: PropertyRepository,
  ) { }

  async execute(input: GetOrCreateConversationInput): Promise<Conversation> {
    // Check if conversation already exists
    const existing = await this.conversationRepository.findByPropertyAndClient(
      input.propertyId,
      input.clientId,
    );

    if (existing) {
      return existing;
    }

    // Find property to get owner
    const property = await this.propertyRepository.findById(input.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    // Validate: client cannot chat with own property
    if (property.ownerId === input.clientId) {
      throw new Error('Cannot start conversation with your own property');
    }

    // Create new conversation
    return this.conversationRepository.create({
      propertyId: input.propertyId,
      clientId: input.clientId,
      ownerId: property.ownerId,
    });
  }
}
