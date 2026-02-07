import { ListMessagesUseCase } from './list-messages.use-case';
import { MessageRepository } from '../../ports/message-repository';
import { ConversationRepository } from '../../ports/conversation-repository';
import { Message, MessageStatus, SenderRole } from '../../../domain/entities/message';
import { Conversation } from '../../../domain/entities/conversation';

describe('ListMessagesUseCase', () => {
  let useCase: ListMessagesUseCase;
  let mockMessageRepository: jest.Mocked<MessageRepository>;
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

  const mockMessages = [
    new Message({
      id: 'msg-1',
      conversationId: 'conv-123',
      senderId: 'client-789',
      senderRole: SenderRole.CLIENTE,
      text: 'Olá, tenho interesse!',
      status: MessageStatus.READ,
      createdAt: new Date('2025-01-01'),
    }),
    new Message({
      id: 'msg-2',
      conversationId: 'conv-123',
      senderId: 'owner-101',
      senderRole: SenderRole.PROPRIETARIO,
      text: 'Olá! Claro, como posso ajudar?',
      status: MessageStatus.SENT,
      createdAt: new Date('2025-01-02'),
    }),
  ];

  beforeEach(() => {
    mockMessageRepository = {
      findById: jest.fn(),
      findByConversationId: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      markAsRead: jest.fn(),
    };

    mockConversationRepository = {
      findById: jest.fn(),
      findByPropertyAndClient: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateLastMessage: jest.fn(),
    };

    useCase = new ListMessagesUseCase(
      mockMessageRepository,
      mockConversationRepository,
    );
  });

  it('should return messages for a conversation', async () => {
    mockConversationRepository.findById.mockResolvedValue(mockConversation);
    mockMessageRepository.findByConversationId.mockResolvedValue(mockMessages);

    const result = await useCase.execute({
      conversationId: 'conv-123',
      userId: 'client-789',
    });

    expect(result).toHaveLength(2);
    expect(mockMessageRepository.findByConversationId).toHaveBeenCalledWith(
      'conv-123',
      { before: undefined, limit: 50 },
    );
  });

  it('should throw if conversation not found', async () => {
    mockConversationRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        conversationId: 'invalid-conv',
        userId: 'client-789',
      }),
    ).rejects.toThrow('Conversation not found');
  });

  it('should throw if user is not participant', async () => {
    mockConversationRepository.findById.mockResolvedValue(mockConversation);

    await expect(
      useCase.execute({
        conversationId: 'conv-123',
        userId: 'random-user',
      }),
    ).rejects.toThrow('Not authorized to view this conversation');
  });

  it('should support pagination with before parameter', async () => {
    mockConversationRepository.findById.mockResolvedValue(mockConversation);
    mockMessageRepository.findByConversationId.mockResolvedValue([mockMessages[0]]);

    await useCase.execute({
      conversationId: 'conv-123',
      userId: 'client-789',
      before: 'msg-2',
      limit: 20,
    });

    expect(mockMessageRepository.findByConversationId).toHaveBeenCalledWith(
      'conv-123',
      { before: 'msg-2', limit: 20 },
    );
  });

  it('should use default limit of 50', async () => {
    mockConversationRepository.findById.mockResolvedValue(mockConversation);
    mockMessageRepository.findByConversationId.mockResolvedValue(mockMessages);

    await useCase.execute({
      conversationId: 'conv-123',
      userId: 'owner-101',
    });

    expect(mockMessageRepository.findByConversationId).toHaveBeenCalledWith(
      'conv-123',
      { before: undefined, limit: 50 },
    );
  });
});
