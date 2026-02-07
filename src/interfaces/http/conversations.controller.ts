import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ListConversationsUseCase } from '../../application/use-cases/chat/list-conversations.use-case';
import { GetOrCreateConversationUseCase } from '../../application/use-cases/chat/get-or-create-conversation.use-case';
import { ListMessagesUseCase } from '../../application/use-cases/chat/list-messages.use-case';
import { SendMessageUseCase } from '../../application/use-cases/chat/send-message.use-case';
import {
  CreateConversationDto,
  SendMessageDto,
  ConversationResponseDto,
  MessageResponseDto,
  ListMessagesQueryDto,
} from './dto/chat.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly listConversationsUseCase: ListConversationsUseCase,
    private readonly getOrCreateConversationUseCase: GetOrCreateConversationUseCase,
    private readonly listMessagesUseCase: ListMessagesUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Listar conversas do usuário' })
  @ApiResponse({ status: 200, type: [ConversationResponseDto] })
  async list(@Request() req): Promise<ConversationResponseDto[]> {
    const conversations = await this.listConversationsUseCase.execute(
      req.user.userId,
    );

    return conversations.map((conv) => ({
      id: conv.id,
      propertyId: conv.propertyId,
      clientId: conv.clientId,
      ownerId: conv.ownerId,
      lastMessage: conv.lastMessage,
      lastMessageTime: conv.lastMessageTime,
      createdAt: conv.createdAt,
    }));
  }

  @Post()
  @ApiOperation({ summary: 'Criar ou obter conversa existente' })
  @ApiResponse({ status: 201, type: ConversationResponseDto })
  async create(
    @Request() req,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.getOrCreateConversationUseCase.execute({
      propertyId: dto.propertyId,
      clientId: req.user.userId,
    });

    return {
      id: conversation.id,
      propertyId: conversation.propertyId,
      clientId: conversation.clientId,
      ownerId: conversation.ownerId,
      lastMessage: conversation.lastMessage,
      lastMessageTime: conversation.lastMessageTime,
      createdAt: conversation.createdAt,
    };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Listar mensagens de uma conversa' })
  @ApiResponse({ status: 200, type: [MessageResponseDto] })
  async messages(
    @Request() req,
    @Param('id') conversationId: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.listMessagesUseCase.execute({
      conversationId,
      userId: req.user.userId,
      before: query.before,
      limit: query.limit,
    });

    return messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderRole: msg.senderRole,
      text: msg.text,
      status: msg.status,
      createdAt: msg.createdAt,
    }));
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Enviar mensagem em uma conversa' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async sendMessage(
    @Request() req,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.sendMessageUseCase.execute({
      conversationId,
      senderId: req.user.userId,
      text: dto.text,
    });

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderRole: message.senderRole,
      text: message.text,
      status: message.status,
      createdAt: message.createdAt,
    };
  }
}
