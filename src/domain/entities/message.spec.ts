import { Message, MessageProps, MessageStatus, SenderRole } from './message';

describe('Message Entity', () => {
  const validProps: MessageProps = {
    id: 'msg-123',
    conversationId: 'conv-456',
    senderId: 'user-789',
    senderRole: SenderRole.CLIENTE,
    text: 'Olá, tenho interesse no imóvel!',
    status: MessageStatus.SENT,
    createdAt: new Date('2025-01-01'),
  };

  describe('constructor', () => {
    it('should create a message with valid props', () => {
      const message = new Message(validProps);

      expect(message.id).toBe('msg-123');
      expect(message.conversationId).toBe('conv-456');
      expect(message.senderId).toBe('user-789');
      expect(message.senderRole).toBe(SenderRole.CLIENTE);
      expect(message.text).toBe('Olá, tenho interesse no imóvel!');
      expect(message.status).toBe(MessageStatus.SENT);
    });

    it('should throw error for empty text', () => {
      const propsWithEmptyText: MessageProps = {
        ...validProps,
        text: '',
      };

      expect(() => new Message(propsWithEmptyText)).toThrow(
        'Message text cannot be empty',
      );
    });

    it('should throw error for whitespace-only text', () => {
      const propsWithWhitespace: MessageProps = {
        ...validProps,
        text: '   ',
      };

      expect(() => new Message(propsWithWhitespace)).toThrow(
        'Message text cannot be empty',
      );
    });
  });

  describe('markAsDelivered', () => {
    it('should return new message with DELIVERED status', () => {
      const message = new Message(validProps);

      const delivered = message.markAsDelivered();

      expect(delivered.status).toBe(MessageStatus.DELIVERED);
      expect(delivered.id).toBe(message.id);
      expect(delivered.text).toBe(message.text);
      // Original should be unchanged (immutability)
      expect(message.status).toBe(MessageStatus.SENT);
    });
  });

  describe('markAsRead', () => {
    it('should return new message with READ status', () => {
      const message = new Message(validProps);

      const read = message.markAsRead();

      expect(read.status).toBe(MessageStatus.READ);
      // Original should be unchanged (immutability)
      expect(message.status).toBe(MessageStatus.SENT);
    });
  });

  describe('SenderRole enum', () => {
    it('should have CLIENTE value', () => {
      expect(SenderRole.CLIENTE).toBe('CLIENTE');
    });

    it('should have PROPRIETARIO value', () => {
      expect(SenderRole.PROPRIETARIO).toBe('PROPRIETARIO');
    });
  });

  describe('MessageStatus enum', () => {
    it('should have SENT value', () => {
      expect(MessageStatus.SENT).toBe('SENT');
    });

    it('should have DELIVERED value', () => {
      expect(MessageStatus.DELIVERED).toBe('DELIVERED');
    });

    it('should have READ value', () => {
      expect(MessageStatus.READ).toBe('READ');
    });
  });
});
