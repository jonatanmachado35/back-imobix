import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { SendMessageUseCase } from '../application/use-cases/chat/send-message.use-case';
import { ListMessagesUseCase } from '../application/use-cases/chat/list-messages.use-case';
import { ConversationRepository } from '../application/ports/conversation-repository';
import { AuthService } from '../auth/auth.service';
import { CONVERSATION_REPOSITORY } from './chat.tokens';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,
    private readonly authService: AuthService,
  ) { }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const user = await this.authService.validateToken(token);
      client.data.userId = user.userId;

      // Join user's personal room for direct messages
      client.join(`user:${user.userId}`);

      // Track online user
      this.onlineUsers.set(client.id, user.userId);

      // Broadcast online status
      this.server.emit('user:online', { userId: user.userId });

      this.logger.log(`User ${user.userId} connected (socket: ${client.id})`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.userId;

    if (userId) {
      this.onlineUsers.delete(client.id);

      // Check if user has other active connections
      const stillOnline = Array.from(this.onlineUsers.values()).includes(
        userId,
      );

      if (!stillOnline) {
        this.server.emit('user:offline', { userId });
      }

      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    payload: { conversationId: string; text: string; tempId: string },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const message = await this.sendMessageUseCase.execute({
        conversationId: payload.conversationId,
        senderId: userId,
        text: payload.text,
      });

      // Get the other participant
      const conversation = await this.conversationRepository.findById(
        payload.conversationId,
      );

      if (conversation) {
        const otherUserId = conversation.getOtherParticipant(userId);

        // Send to the other participant
        this.server.to(`user:${otherUserId}`).emit('message:receive', {
          id: message.id,
          conversationId: payload.conversationId,
          senderId: userId,
          senderRole: message.senderRole,
          text: payload.text,
          timestamp: message.createdAt.toISOString(),
        });
      }

      return {
        success: true,
        messageId: message.id,
        tempId: payload.tempId,
      };
    } catch (error) {
      this.logger.error(`Send message error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    payload: { conversationId: string; lastReadMessageId: string },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const conversation = await this.conversationRepository.findById(
        payload.conversationId,
      );

      if (conversation) {
        const otherUserId = conversation.getOtherParticipant(userId);

        // Notify the sender that their message was read
        this.server.to(`user:${otherUserId}`).emit('message:status', {
          messageId: payload.lastReadMessageId,
          conversationId: payload.conversationId,
          status: 'READ',
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Message read error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('user:typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.data.userId;

    if (!userId) return;

    try {
      const conversation = await this.conversationRepository.findById(
        payload.conversationId,
      );

      if (conversation) {
        const otherUserId = conversation.getOtherParticipant(userId);

        this.server.to(`user:${otherUserId}`).emit('user:typing', {
          conversationId: payload.conversationId,
          userId,
        });
      }
    } catch (error) {
      this.logger.error(`Typing event error: ${error.message}`);
    }
  }

  @SubscribeMessage('user:stop_typing')
  async handleStopTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.data.userId;

    if (!userId) return;

    try {
      const conversation = await this.conversationRepository.findById(
        payload.conversationId,
      );

      if (conversation) {
        const otherUserId = conversation.getOtherParticipant(userId);

        this.server.to(`user:${otherUserId}`).emit('user:stop_typing', {
          conversationId: payload.conversationId,
          userId,
        });
      }
    } catch (error) {
      this.logger.error(`Stop typing event error: ${error.message}`);
    }
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.data.userId;

    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
      const conversation = await this.conversationRepository.findById(
        payload.conversationId,
      );

      if (!conversation || !conversation.isParticipant(userId)) {
        return { success: false, error: 'Not authorized' };
      }

      client.join(`conversation:${payload.conversationId}`);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    client.leave(`conversation:${payload.conversationId}`);
    return { success: true };
  }
}
