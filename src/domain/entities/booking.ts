export enum BookingStatus {
  PENDENTE = 'PENDENTE',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA',
  CONCLUIDA = 'CONCLUIDA',
}

export class InvalidBookingError extends Error {
  constructor(message: string) {
    super(`Invalid booking: ${message}`);
    this.name = 'InvalidBookingError';
  }
}

export interface BookingProps {
  id: string;
  propertyId: string;
  guestId: string;
  ownerId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  adults: number;
  children: number;
  totalNights: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  totalPrice: number;
  status: BookingStatus;
  message?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Booking {
  constructor(private readonly props: BookingProps) {
    this.validate();
  }

  private validate(): void {
    if (this.props.checkOut <= this.props.checkIn) {
      throw new InvalidBookingError('checkOut must be after checkIn');
    }

    if (this.props.guests <= 0) {
      throw new InvalidBookingError('guests must be greater than 0');
    }

    if (this.props.totalNights <= 0) {
      throw new InvalidBookingError('totalNights must be greater than 0');
    }
  }

  get id(): string { return this.props.id; }
  get propertyId(): string { return this.props.propertyId; }
  get guestId(): string { return this.props.guestId; }
  get ownerId(): string { return this.props.ownerId; }
  get checkIn(): Date { return this.props.checkIn; }
  get checkOut(): Date { return this.props.checkOut; }
  get guests(): number { return this.props.guests; }
  get adults(): number { return this.props.adults; }
  get children(): number { return this.props.children; }
  get totalNights(): number { return this.props.totalNights; }
  get pricePerNight(): number { return this.props.pricePerNight; }
  get cleaningFee(): number { return this.props.cleaningFee; }
  get serviceFee(): number { return this.props.serviceFee; }
  get totalPrice(): number { return this.props.totalPrice; }
  get status(): BookingStatus { return this.props.status; }
  get message(): string | null { return this.props.message ?? null; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * Proprietário confirma a reserva
   * PENDENTE -> CONFIRMADA
   */
  confirm(): Booking {
    if (this.props.status !== BookingStatus.PENDENTE) {
      throw new InvalidBookingError('Only pending bookings can be confirmed');
    }
    return new Booking({
      ...this.props,
      status: BookingStatus.CONFIRMADA,
      updatedAt: new Date(),
    });
  }

  /**
   * Proprietário ou Cliente cancela
   * PENDENTE -> CANCELADA
   * CONFIRMADA -> CANCELADA (apenas cliente)
   */
  cancel(byOwner: boolean = false): Booking {
    if (this.props.status === BookingStatus.CONCLUIDA) {
      throw new InvalidBookingError('Cannot cancel a completed booking');
    }
    if (this.props.status === BookingStatus.CANCELADA) {
      throw new InvalidBookingError('Booking is already cancelled');
    }
    if (byOwner && this.props.status === BookingStatus.CONFIRMADA) {
      throw new InvalidBookingError('Owner cannot cancel a confirmed booking');
    }
    return new Booking({
      ...this.props,
      status: BookingStatus.CANCELADA,
      updatedAt: new Date(),
    });
  }

  /**
   * Sistema marca como concluída (após checkout)
   * CONFIRMADA -> CONCLUIDA
   */
  complete(): Booking {
    if (this.props.status !== BookingStatus.CONFIRMADA) {
      throw new InvalidBookingError('Only confirmed bookings can be completed');
    }
    const now = new Date();
    if (now < this.props.checkOut) {
      throw new InvalidBookingError('Cannot complete booking before checkout date');
    }
    return new Booking({
      ...this.props,
      status: BookingStatus.CONCLUIDA,
      updatedAt: new Date(),
    });
  }

  /**
   * Calcula preço total
   */
  static calculatePrice(
    pricePerNight: number,
    totalNights: number,
  ): { subtotal: number; cleaningFee: number; serviceFee: number; total: number } {
    const subtotal = pricePerNight * totalNights;
    const cleaningFee = Math.round(pricePerNight * 0.3 * 100) / 100;
    const serviceFee = Math.round(subtotal * 0.1 * 100) / 100;
    const total = subtotal + cleaningFee + serviceFee;
    return { subtotal, cleaningFee, serviceFee, total };
  }

  toJSON() {
    return {
      id: this.id,
      propertyId: this.propertyId,
      guestId: this.guestId,
      ownerId: this.ownerId,
      checkIn: this.checkIn.toISOString(),
      checkOut: this.checkOut.toISOString(),
      guests: this.guests,
      adults: this.adults,
      children: this.children,
      totalNights: this.totalNights,
      pricePerNight: this.pricePerNight,
      cleaningFee: this.cleaningFee,
      serviceFee: this.serviceFee,
      totalPrice: this.totalPrice,
      status: this.status,
      message: this.message,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
