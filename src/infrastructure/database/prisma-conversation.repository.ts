import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConversationRepository } from '../../application/ports/conversation-repository';
import { Conversation } from '../../domain/entities/conversation';

@Injectable()
export class PrismaConversationRepository implements ConversationRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findById(id: string): Promise<Conversation | null> {
    const record = await this.prisma.chatConversation.findUnique({
      where: { id },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByPropertyAndClient(
    propertyId: string,
    clientId: string,
  ): Promise<Conversation | null> {
    const record = await this.prisma.chatConversation.findUnique({
      where: {
        propertyId_clientId: {
          propertyId,
          clientId,
        },
      },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByUserId(userId: string): Promise<Conversation[]> {
    const records = await this.prisma.chatConversation.findMany({
      where: {
        OR: [{ clientId: userId }, { ownerId: userId }],
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return records.map((record) => this.toDomain(record));
  }

  async create(data: {
    propertyId: string;
    clientId: string;
    ownerId: string;
  }): Promise<Conversation> {
    const record = await this.prisma.chatConversation.create({
      data: {
        propertyId: data.propertyId,
        clientId: data.clientId,
        ownerId: data.ownerId,
      },
    });

    return this.toDomain(record);
  }

  async updateLastMessage(id: string, text: string): Promise<Conversation> {
    const record = await this.prisma.chatConversation.update({
      where: { id },
      data: {
        lastMessage: text,
        lastMessageTime: new Date(),
      },
    });

    return this.toDomain(record);
  }

  private toDomain(record: {
    id: string;
    propertyId: string;
    clientId: string;
    ownerId: string;
    lastMessage: string | null;
    lastMessageTime: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Conversation {
    return new Conversation({
      id: record.id,
      propertyId: record.propertyId,
      clientId: record.clientId,
      ownerId: record.ownerId,
      lastMessage: record.lastMessage,
      lastMessageTime: record.lastMessageTime,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
