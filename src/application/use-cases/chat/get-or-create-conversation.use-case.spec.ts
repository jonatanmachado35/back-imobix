import { GetOrCreateConversationUseCase } from './get-or-create-conversation.use-case';
import { ConversationRepository } from '../../ports/conversation-repository';
import { PropertyRepository } from '../../ports/property-repository';
import { Conversation } from '../../../domain/entities/conversation';
import { Property, PropertyType, PropertyStatus } from '../../../domain/entities/property';

describe('GetOrCreateConversationUseCase', () => {
  let useCase: GetOrCreateConversationUseCase;
  let mockConversationRepository: jest.Mocked<ConversationRepository>;
  let mockPropertyRepository: jest.Mocked<PropertyRepository>;

  const mockProperty = new Property({
    id: 'prop-456',
    ownerId: 'owner-101',
    type: PropertyType.TEMPORADA,
    status: PropertyStatus.ATIVO,
    title: 'Casa na Praia',
    pricePerNight: 500,
    minNights: 2,
    maxGuests: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

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

  beforeEach(() => {
    mockConversationRepository = {
      findById: jest.fn(),
      findByPropertyAndClient: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateLastMessage: jest.fn(),
    };

    mockPropertyRepository = {
      findById: jest.fn(),
      findByOwner: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      countByOwner: jest.fn(),
      delete: jest.fn(),
      hasConflictingBooking: jest.fn(),
      findImagesByPropertyId: jest.fn(),
      findImageById: jest.fn(),
      createImage: jest.fn(),
      deleteImage: jest.fn(),
      clearImagePrimary: jest.fn(),
      setImagePrimary: jest.fn(),
    };

    useCase = new GetOrCreateConversationUseCase(
      mockConversationRepository,
      mockPropertyRepository,
    );
  });

  describe('when conversation exists', () => {
    it('should return existing conversation', async () => {
      mockConversationRepository.findByPropertyAndClient.mockResolvedValue(mockConversation);

      const result = await useCase.execute({
        propertyId: 'prop-456',
        clientId: 'client-789',
      });

      expect(result.id).toBe('conv-123');
      expect(mockConversationRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('when conversation does not exist', () => {
    it('should create new conversation', async () => {
      mockConversationRepository.findByPropertyAndClient.mockResolvedValue(null);
      mockPropertyRepository.findById.mockResolvedValue(mockProperty);
      mockConversationRepository.create.mockResolvedValue(mockConversation);

      const result = await useCase.execute({
        propertyId: 'prop-456',
        clientId: 'client-789',
      });

      expect(result.id).toBe('conv-123');
      expect(mockConversationRepository.create).toHaveBeenCalledWith({
        propertyId: 'prop-456',
        clientId: 'client-789',
        ownerId: 'owner-101',
      });
    });

    it('should throw if property not found', async () => {
      mockConversationRepository.findByPropertyAndClient.mockResolvedValue(null);
      mockPropertyRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          propertyId: 'invalid-prop',
          clientId: 'client-789',
        }),
      ).rejects.toThrow('Property not found');
    });
  });

  describe('validation', () => {
    it('should throw if client tries to start conversation with own property', async () => {
      mockConversationRepository.findByPropertyAndClient.mockResolvedValue(null);
      mockPropertyRepository.findById.mockResolvedValue(mockProperty);

      await expect(
        useCase.execute({
          propertyId: 'prop-456',
          clientId: 'owner-101', // Same as owner
        }),
      ).rejects.toThrow('Cannot start conversation with your own property');
    });
  });
});
