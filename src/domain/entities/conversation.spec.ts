import { Conversation, ConversationProps } from './conversation';

describe('Conversation Entity', () => {
  const validProps: ConversationProps = {
    id: 'conv-123',
    propertyId: 'prop-456',
    clientId: 'client-789',
    ownerId: 'owner-101',
    lastMessage: null,
    lastMessageTime: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  describe('constructor', () => {
    it('should create a conversation with valid props', () => {
      const conversation = new Conversation(validProps);

      expect(conversation.id).toBe('conv-123');
      expect(conversation.propertyId).toBe('prop-456');
      expect(conversation.clientId).toBe('client-789');
      expect(conversation.ownerId).toBe('owner-101');
      expect(conversation.lastMessage).toBeNull();
      expect(conversation.lastMessageTime).toBeNull();
    });

    it('should create conversation with last message', () => {
      const propsWithMessage: ConversationProps = {
        ...validProps,
        lastMessage: 'Olá, tenho interesse!',
        lastMessageTime: new Date('2025-01-02'),
      };

      const conversation = new Conversation(propsWithMessage);

      expect(conversation.lastMessage).toBe('Olá, tenho interesse!');
      expect(conversation.lastMessageTime).toEqual(new Date('2025-01-02'));
    });
  });

  describe('isParticipant', () => {
    it('should return true for client', () => {
      const conversation = new Conversation(validProps);

      expect(conversation.isParticipant('client-789')).toBe(true);
    });

    it('should return true for owner', () => {
      const conversation = new Conversation(validProps);

      expect(conversation.isParticipant('owner-101')).toBe(true);
    });

    it('should return false for non-participant', () => {
      const conversation = new Conversation(validProps);

      expect(conversation.isParticipant('random-user')).toBe(false);
    });
  });

  describe('getOtherParticipant', () => {
    it('should return owner when called by client', () => {
      const conversation = new Conversation(validProps);

      expect(conversation.getOtherParticipant('client-789')).toBe('owner-101');
    });

    it('should return client when called by owner', () => {
      const conversation = new Conversation(validProps);

      expect(conversation.getOtherParticipant('owner-101')).toBe('client-789');
    });
  });

  describe('updateLastMessage', () => {
    it('should return new conversation with updated lastMessage', () => {
      const conversation = new Conversation(validProps);

      const updated = conversation.updateLastMessage('Nova mensagem');

      expect(updated.lastMessage).toBe('Nova mensagem');
      expect(updated.lastMessageTime).toBeInstanceOf(Date);
      // Original should be unchanged (immutability)
      expect(conversation.lastMessage).toBeNull();
    });
  });
});
