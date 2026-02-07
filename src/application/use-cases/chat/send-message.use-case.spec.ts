import { SendMessageUseCase } from './send-message.use-case';
import { MessageRepository } from '../../ports/message-repository';
import { ConversationRepository } from '../../ports/conversation-repository';
import { Message, MessageStatus, SenderRole } from '../../../domain/entities/message';
import { Conversation } from '../../../domain/entities/conversation';

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase;
  let mockMessageRepository: jest.Mocked<MessageRepository>;
  let mockConversationRepository: jest.Mocked<ConversationRepository>;

  const mockConversation = new Conversation({
    id: 'conv-123',
    propertyId: 'prop-456',
    clientId: 'client-789',
    ownerId: 'owner-101',
    lastMessage: null,
    lastMessageTime: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockMessage = new Message({
    id: 'msg-123',
    conversationId: 'conv-123',
    senderId: 'client-789',
    senderRole: SenderRole.CLIENTE,
    text: 'Olá, tenho interesse!',
    status: MessageStatus.SENT,
    createdAt: new Date(),
  });

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

    useCase = new SendMessageUseCase(
      mockMessageRepository,
      mockConversationRepository,
    );
  });

  it('should create a message as client', async () => {
    mockConversationRepository.findById.mockResolvedValue(mockConversation);
    mockMessageRepository.create.mockResolvedValue(mockMessage);
    mockConversationRepository.updateLastMessage.mockResolvedValue(mockConversation);

    const result = await useCase.execute({
      conversationId: 'conv-123',
      senderId: 'client-789',
      text: 'Olá, tenho interesse!',
    });

    expect(result.id).toBe('msg-123');
    expect(result.senderRole).toBe(SenderRole.CLIENTE);
    expect(mockMessageRepository.create).toHaveBeenCalledWith({
      conversationId: 'conv-123',
      senderId: 'client-789',
      senderRole: SenderRole.CLIENTE,
      text: 'Olá, tenho interesse!',
    });
  });

  it('should create a message as owner', async () => {
    const ownerMessage = new Message({
      id: 'msg-124',
      conversationId: 'conv-123',
      senderId: 'owner-101',
      senderRole: SenderRole.PROPRIETARIO,
      text: 'Claro, como posso ajudar?',
      status: MessageStatus.SENT,
      createdAt: new Date(),
    });

    mockConversationRepository.findById.mockResolvedValue(mockConversation);
    mockMessageRepository.create.mockResolvedValue(ownerMessage);
    mockConversationRepository.updateLastMessage.mockResolvedValue(mockConversation);

    const result = await useCase.execute({
      conversationId: 'conv-123',
      senderId: 'owner-101',
      text: 'Claro, como posso ajudar?',
    });

    expect(result.senderRole).toBe(SenderRole.PROPRIETARIO);
    expect(mockMessageRepository.create).toHaveBeenCalledWith({
      conversationId: 'conv-123',
      senderId: 'owner-101',
      senderRole: SenderRole.PROPRIETARIO,
      text: 'Claro, como posso ajudar?',
    });
  });

  it('should update conversation lastMessage', async () => {
    mockConversationRepository.findById.mockResolvedValue(mockConversation);
    mockMessageRepository.create.mockResolvedValue(mockMessage);
    mockConversationRepository.updateLastMessage.mockResolvedValue(mockConversation);

    await useCase.execute({
      conversationId: 'conv-123',
      senderId: 'client-789',
      text: 'Nova mensagem',
    });

    expect(mockConversationRepository.updateLastMessage).toHaveBeenCalledWith(
      'conv-123',
      'Nova mensagem',
    );
  });

  it('should throw if conversation not found', async () => {
    mockConversationRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        conversationId: 'invalid-conv',
        senderId: 'client-789',
        text: 'Olá',
      }),
    ).rejects.toThrow('Conversation not found');
  });

  it('should throw if sender is not participant', async () => {
    mockConversationRepository.findById.mockResolvedValue(mockConversation);

    await expect(
      useCase.execute({
        conversationId: 'conv-123',
        senderId: 'random-user',
        text: 'Olá',
      }),
    ).rejects.toThrow('Not authorized to send message');
  });

  it('should throw if text is empty', async () => {
    mockConversationRepository.findById.mockResolvedValue(mockConversation);

    await expect(
      useCase.execute({
        conversationId: 'conv-123',
        senderId: 'client-789',
        text: '',
      }),
    ).rejects.toThrow('Message text cannot be empty');
  });

  it('should throw if text is only whitespace', async () => {
    mockConversationRepository.findById.mockResolvedValue(mockConversation);

    await expect(
      useCase.execute({
        conversationId: 'conv-123',
        senderId: 'client-789',
        text: '   ',
      }),
    ).rejects.toThrow('Message text cannot be empty');
  });
});
