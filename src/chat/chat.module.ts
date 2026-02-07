import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { ConversationsController } from '../interfaces/http/conversations.controller';
import { CONVERSATION_REPOSITORY, MESSAGE_REPOSITORY } from './chat.tokens';
import { PROPERTY_REPOSITORY } from '../properties/properties.tokens';
import { PrismaConversationRepository } from '../infrastructure/database/prisma-conversation.repository';
import { PrismaMessageRepository } from '../infrastructure/database/prisma-message.repository';
import { PrismaPropertyRepository } from '../infrastructure/database/prisma-property.repository';
import { ListConversationsUseCase } from '../application/use-cases/chat/list-conversations.use-case';
import { GetOrCreateConversationUseCase } from '../application/use-cases/chat/get-or-create-conversation.use-case';
import { ListMessagesUseCase } from '../application/use-cases/chat/list-messages.use-case';
import { SendMessageUseCase } from '../application/use-cases/chat/send-message.use-case';
import { ConversationRepository } from '../application/ports/conversation-repository';

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule)],
  controllers: [ConversationsController],
  providers: [
    // Repositories
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: PrismaConversationRepository,
    },
    {
      provide: MESSAGE_REPOSITORY,
      useClass: PrismaMessageRepository,
    },
    {
      provide: PROPERTY_REPOSITORY,
      useClass: PrismaPropertyRepository,
    },

    // Use Cases
    {
      provide: ListConversationsUseCase,
      useFactory: (repo: ConversationRepository) =>
        new ListConversationsUseCase(repo),
      inject: [CONVERSATION_REPOSITORY],
    },
    {
      provide: GetOrCreateConversationUseCase,
      useFactory: (convRepo, propRepo) =>
        new GetOrCreateConversationUseCase(convRepo, propRepo),
      inject: [CONVERSATION_REPOSITORY, PROPERTY_REPOSITORY],
    },
    {
      provide: ListMessagesUseCase,
      useFactory: (msgRepo, convRepo) =>
        new ListMessagesUseCase(msgRepo, convRepo),
      inject: [MESSAGE_REPOSITORY, CONVERSATION_REPOSITORY],
    },
    {
      provide: SendMessageUseCase,
      useFactory: (msgRepo, convRepo) =>
        new SendMessageUseCase(msgRepo, convRepo),
      inject: [MESSAGE_REPOSITORY, CONVERSATION_REPOSITORY],
    },

    // WebSocket Gateway
    ChatGateway,
  ],
  exports: [CONVERSATION_REPOSITORY, MESSAGE_REPOSITORY],
})
export class ChatModule { }
