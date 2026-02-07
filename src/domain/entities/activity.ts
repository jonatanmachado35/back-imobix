export enum ActivityType {
  RESERVA_CRIADA = 'RESERVA_CRIADA',
  RESERVA_CONFIRMADA = 'RESERVA_CONFIRMADA',
  RESERVA_CANCELADA = 'RESERVA_CANCELADA',
  RESERVA_CONCLUIDA = 'RESERVA_CONCLUIDA',
  FAVORITO_ADICIONADO = 'FAVORITO_ADICIONADO',
  FAVORITO_REMOVIDO = 'FAVORITO_REMOVIDO',
  MENSAGEM_RECEBIDA = 'MENSAGEM_RECEBIDA',
  IMOVEL_CRIADO = 'IMOVEL_CRIADO',
  IMOVEL_ATUALIZADO = 'IMOVEL_ATUALIZADO',
}

export interface ActivityProps {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  propertyId?: string;
  bookingId?: string;
  createdAt: Date;
}

export class Activity {
  readonly id: string;
  readonly userId: string;
  readonly type: ActivityType;
  readonly title: string;
  readonly description?: string;
  readonly propertyId?: string;
  readonly bookingId?: string;
  readonly createdAt: Date;

  constructor(props: ActivityProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.type = props.type;
    this.title = props.title;
    this.description = props.description;
    this.propertyId = props.propertyId;
    this.bookingId = props.bookingId;
    this.createdAt = props.createdAt;
  }
}
