export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export enum SenderRole {
  CLIENTE = 'CLIENTE',
  PROPRIETARIO = 'PROPRIETARIO',
}

export interface MessageProps {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: SenderRole;
  text: string;
  status: MessageStatus;
  createdAt: Date;
}

export class Message {
  constructor(private readonly props: MessageProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.text || this.props.text.trim().length === 0) {
      throw new Error('Message text cannot be empty');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get conversationId(): string {
    return this.props.conversationId;
  }

  get senderId(): string {
    return this.props.senderId;
  }

  get senderRole(): SenderRole {
    return this.props.senderRole;
  }

  get text(): string {
    return this.props.text;
  }

  get status(): MessageStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  markAsDelivered(): Message {
    return new Message({
      ...this.props,
      status: MessageStatus.DELIVERED,
    });
  }

  markAsRead(): Message {
    return new Message({
      ...this.props,
      status: MessageStatus.READ,
    });
  }
}
