export interface ConversationProps {
  id: string;
  propertyId: string;
  clientId: string;
  ownerId: string;
  lastMessage?: string | null;
  lastMessageTime?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Conversation {
  constructor(private readonly props: ConversationProps) { }

  get id(): string {
    return this.props.id;
  }

  get propertyId(): string {
    return this.props.propertyId;
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get lastMessage(): string | null {
    return this.props.lastMessage ?? null;
  }

  get lastMessageTime(): Date | null {
    return this.props.lastMessageTime ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isParticipant(userId: string): boolean {
    return userId === this.props.clientId || userId === this.props.ownerId;
  }

  getOtherParticipant(userId: string): string {
    return userId === this.props.clientId
      ? this.props.ownerId
      : this.props.clientId;
  }

  updateLastMessage(text: string): Conversation {
    return new Conversation({
      ...this.props,
      lastMessage: text,
      lastMessageTime: new Date(),
      updatedAt: new Date(),
    });
  }
}
