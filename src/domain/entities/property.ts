export enum PropertyType {
  VENDA = 'VENDA',
  ALUGUEL = 'ALUGUEL',
  TEMPORADA = 'TEMPORADA',
}

export enum PropertyStatus {
  ATIVO = 'ATIVO',
  PAUSADO = 'PAUSADO',
  REMOVIDO = 'REMOVIDO',
}

export enum PropertyCategory {
  CHALE = 'CHALE',
  PRAIA = 'PRAIA',
  FAZENDA = 'FAZENDA',
  SITIO = 'SITIO',
  LUXO = 'LUXO',
  CASA = 'CASA',
  APARTAMENTO = 'APARTAMENTO',
}

export class InvalidPropertyDataError extends Error {
  constructor(message: string) {
    super(`Invalid property data: ${message}`);
    this.name = 'InvalidPropertyDataError';
  }
}

export interface PropertyProps {
  id: string;
  ownerId: string;
  type: PropertyType;
  status: PropertyStatus;
  title: string;
  description?: string | null;
  price?: number | null;
  currency?: string;
  pricePerNight?: number | null;
  holidayPrice?: number | null;
  address?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  area?: number | null;
  rating?: number | null;
  reviewCount?: number;
  amenities?: string[];
  petFriendly?: boolean;
  furnished?: boolean;
  minNights?: number | null;
  maxGuests?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  houseRules?: string[];
  category?: PropertyCategory | null;
  blockedDates?: string[];
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Property {
  constructor(private readonly props: PropertyProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.title || this.props.title.trim().length === 0) {
      throw new InvalidPropertyDataError('Title is required');
    }

    if (this.props.type === PropertyType.TEMPORADA) {
      if (!this.props.pricePerNight || this.props.pricePerNight <= 0) {
        throw new InvalidPropertyDataError('pricePerNight is required for TEMPORADA');
      }
    } else {
      if (!this.props.price || this.props.price <= 0) {
        throw new InvalidPropertyDataError('price is required for VENDA/ALUGUEL');
      }
    }
  }

  get id(): string { return this.props.id; }
  get ownerId(): string { return this.props.ownerId; }
  get type(): PropertyType { return this.props.type; }
  get status(): PropertyStatus { return this.props.status; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description ?? null; }
  get price(): number | null { return this.props.price ?? null; }
  get currency(): string { return this.props.currency ?? 'BRL'; }
  get pricePerNight(): number | null { return this.props.pricePerNight ?? null; }
  get holidayPrice(): number | null { return this.props.holidayPrice ?? null; }
  get address(): string | null { return this.props.address ?? null; }
  get city(): string | null { return this.props.city ?? null; }
  get neighborhood(): string | null { return this.props.neighborhood ?? null; }
  get bedrooms(): number { return this.props.bedrooms ?? 0; }
  get bathrooms(): number { return this.props.bathrooms ?? 0; }
  get parkingSpaces(): number { return this.props.parkingSpaces ?? 0; }
  get area(): number | null { return this.props.area ?? null; }
  get rating(): number | null { return this.props.rating ?? null; }
  get reviewCount(): number { return this.props.reviewCount ?? 0; }
  get amenities(): string[] { return this.props.amenities ?? []; }
  get petFriendly(): boolean { return this.props.petFriendly ?? false; }
  get furnished(): boolean { return this.props.furnished ?? false; }
  get minNights(): number | null { return this.props.minNights ?? null; }
  get maxGuests(): number | null { return this.props.maxGuests ?? null; }
  get checkInTime(): string | null { return this.props.checkInTime ?? null; }
  get checkOutTime(): string | null { return this.props.checkOutTime ?? null; }
  get houseRules(): string[] { return this.props.houseRules ?? []; }
  get category(): PropertyCategory | null { return this.props.category ?? null; }
  get blockedDates(): string[] { return this.props.blockedDates ?? []; }
  get images(): string[] { return this.props.images ?? []; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  pause(): Property {
    if (this.props.status === PropertyStatus.REMOVIDO) {
      throw new Error('Cannot pause a removed property');
    }
    return new Property({
      ...this.props,
      status: PropertyStatus.PAUSADO,
      updatedAt: new Date(),
    });
  }

  activate(): Property {
    if (this.props.status === PropertyStatus.REMOVIDO) {
      throw new Error('Cannot activate a removed property');
    }
    return new Property({
      ...this.props,
      status: PropertyStatus.ATIVO,
      updatedAt: new Date(),
    });
  }

  remove(): Property {
    return new Property({
      ...this.props,
      status: PropertyStatus.REMOVIDO,
      updatedAt: new Date(),
    });
  }

  isAvailableForBooking(): boolean {
    return this.props.status === PropertyStatus.ATIVO;
  }

  toJSON() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      type: this.type,
      status: this.status,
      title: this.title,
      description: this.description,
      price: this.price,
      currency: this.currency,
      pricePerNight: this.pricePerNight,
      holidayPrice: this.holidayPrice,
      address: this.address,
      city: this.city,
      neighborhood: this.neighborhood,
      bedrooms: this.bedrooms,
      bathrooms: this.bathrooms,
      parkingSpaces: this.parkingSpaces,
      area: this.area,
      rating: this.rating,
      reviewCount: this.reviewCount,
      amenities: this.amenities,
      petFriendly: this.petFriendly,
      furnished: this.furnished,
      minNights: this.minNights,
      maxGuests: this.maxGuests,
      checkInTime: this.checkInTime,
      checkOutTime: this.checkOutTime,
      houseRules: this.houseRules,
      category: this.category,
      blockedDates: this.blockedDates,
      images: this.images,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
