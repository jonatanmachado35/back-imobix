import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  MessageRepository,
  CreateMessageInput,
} from '../../application/ports/message-repository';
import {
  Message,
  MessageStatus,
  SenderRole,
} from '../../domain/entities/message';

@Injectable()
export class PrismaMessageRepository implements MessageRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findById(id: string): Promise<Message | null> {
    const record = await this.prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByConversationId(
    conversationId: string,
    options?: {
      before?: string;
      limit?: number;
    },
  ): Promise<Message[]> {
    const { before, limit = 50 } = options || {};

    let cursor: { id: string } | undefined;
    if (before) {
      cursor = { id: before };
    }

    const records = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && {
        cursor,
        skip: 1, // Skip the cursor item itself
      }),
    });

    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateMessageInput): Promise<Message> {
    const record = await this.prisma.chatMessage.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderRole: data.senderRole,
        text: data.text,
        status: MessageStatus.SENT,
      },
    });

    return this.toDomain(record);
  }

  async updateStatus(id: string, status: MessageStatus): Promise<Message> {
    const record = await this.prisma.chatMessage.update({
      where: { id },
      data: { status },
    });

    return this.toDomain(record);
  }

  async markAsRead(
    conversationId: string,
    lastMessageId: string,
    userId: string,
  ): Promise<void> {
    // Find the message to get its createdAt
    const lastMessage = await this.prisma.chatMessage.findUnique({
      where: { id: lastMessageId },
    });

    if (!lastMessage) return;

    // Mark all messages as READ where:
    // - conversationId matches
    // - createdAt is <= lastMessage.createdAt
    // - senderId is NOT the current user (we don't mark our own as read)
    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        createdAt: { lte: lastMessage.createdAt },
        senderId: { not: userId },
        status: { not: MessageStatus.READ },
      },
      data: { status: MessageStatus.READ },
    });
  }

  private toDomain(record: {
    id: string;
    conversationId: string;
    senderId: string;
    senderRole: string;
    text: string;
    status: string;
    createdAt: Date;
  }): Message {
    return new Message({
      id: record.id,
      conversationId: record.conversationId,
      senderId: record.senderId,
      senderRole: record.senderRole as SenderRole,
      text: record.text,
      status: record.status as MessageStatus,
      createdAt: record.createdAt,
    });
  }
}
