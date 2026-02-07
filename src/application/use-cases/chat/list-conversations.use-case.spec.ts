import { ListConversationsUseCase } from './list-conversations.use-case';
import { ConversationRepository } from '../../ports/conversation-repository';
import { Conversation } from '../../../domain/entities/conversation';

describe('ListConversationsUseCase', () => {
  let useCase: ListConversationsUseCase;
  let mockConversationRepository: jest.Mocked<ConversationRepository>;

  const mockConversation = new Conversation({
    id: 'conv-123',
    propertyId: 'prop-456',
    clientId: 'client-789',
    ownerId: 'owner-101',
    lastMessage: 'Olá!',
    lastMessageTime: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockConversationRepository = {
      findById: jest.fn(),
      findByPropertyAndClient: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateLastMessage: jest.fn(),
    };

    useCase = new ListConversationsUseCase(mockConversationRepository);
  });

  it('should return conversations for a user', async () => {
    mockConversationRepository.findByUserId.mockResolvedValue([mockConversation]);

    const result = await useCase.execute('client-789');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('conv-123');
    expect(mockConversationRepository.findByUserId).toHaveBeenCalledWith('client-789');
  });

  it('should return empty array if no conversations', async () => {
    mockConversationRepository.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute('user-no-conv');

    expect(result).toHaveLength(0);
  });

  it('should return conversations for owner as well', async () => {
    mockConversationRepository.findByUserId.mockResolvedValue([mockConversation]);

    const result = await useCase.execute('owner-101');

    expect(result).toHaveLength(1);
    expect(mockConversationRepository.findByUserId).toHaveBeenCalledWith('owner-101');
  });
});
