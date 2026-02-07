import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConversationDto {
  @ApiProperty({ description: 'ID do imóvel' })
  @IsString()
  @IsNotEmpty()
  propertyId: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Texto da mensagem' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class ConversationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  propertyId: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  ownerId: string;

  @ApiPropertyOptional()
  lastMessage?: string | null;

  @ApiPropertyOptional()
  lastMessageTime?: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  conversationId: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty({ enum: ['CLIENTE', 'PROPRIETARIO'] })
  senderRole: string;

  @ApiProperty()
  text: string;

  @ApiProperty({ enum: ['SENT', 'DELIVERED', 'READ'] })
  status: string;

  @ApiProperty()
  createdAt: Date;
}

export class ListMessagesQueryDto {
  @ApiPropertyOptional({ description: 'ID da última mensagem para paginação' })
  @IsOptional()
  @IsString()
  before?: string;

  @ApiPropertyOptional({ description: 'Limite de mensagens', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
