import {
  CreateBookingUseCase,
  CreateBookingInput,
  PropertyNotFoundError,
  PropertyNotAvailableError,
  MinNightsRequiredError,
  MaxGuestsExceededError,
  DatesUnavailableError,
} from './create-booking.use-case';
import { Booking, BookingStatus } from '../../../domain/entities/booking';
import { Property, PropertyStatus, PropertyType } from '../../../domain/entities/property';
import { BookingRepository, CreateBookingData } from '../../ports/booking-repository';
import { PropertyRepository, PropertyFilters, CreatePropertyData, UpdatePropertyData } from '../../ports/property-repository';
import { ActivityRepository, CreateActivityData } from '../../ports/activity-repository';

// In-memory repositories for testing
class InMemoryBookingRepository implements BookingRepository {
  private bookings: Booking[] = [];
  private idCounter = 1;

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.find((b) => b.id === id) || null;
  }

  async findByGuest(guestId: string): Promise<Booking[]> {
    return this.bookings.filter((b) => b.guestId === guestId);
  }

  async findByOwner(ownerId: string): Promise<Booking[]> {
    return this.bookings.filter((b) => b.ownerId === ownerId);
  }

  async findRecentByOwner(ownerId: string, limit: number): Promise<Booking[]> {
    return this.bookings
      .filter((b) => b.ownerId === ownerId)
      .slice(0, limit);
  }

  async countByOwnerAndStatus(ownerId: string, status: BookingStatus): Promise<number> {
    return this.bookings.filter((b) => b.ownerId === ownerId && b.status === status).length;
  }

  async sumRevenueByOwner(ownerId: string): Promise<number> {
    return this.bookings
      .filter((b) => b.ownerId === ownerId && b.status === BookingStatus.CONCLUIDA)
      .reduce((sum, b) => sum + b.totalPrice, 0);
  }

  async hasConflictingBooking(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string,
  ): Promise<boolean> {
    return this.bookings.some((b) => {
      if (b.propertyId !== propertyId) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.status === BookingStatus.CANCELADA) return false;

      // Check for date overlap
      const existingCheckIn = new Date(b.checkIn);
      const existingCheckOut = new Date(b.checkOut);

      return checkIn < existingCheckOut && checkOut > existingCheckIn;
    });
  }

  async create(data: CreateBookingData): Promise<Booking> {
    const booking = new Booking({
      id: `booking-${this.idCounter++}`,
      propertyId: data.propertyId,
      guestId: data.guestId,
      ownerId: data.ownerId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      adults: data.adults,
      children: data.children,
      totalNights: data.totalNights,
      pricePerNight: data.pricePerNight,
      cleaningFee: data.cleaningFee,
      serviceFee: data.serviceFee,
      totalPrice: data.totalPrice,
      status: BookingStatus.PENDENTE,
      message: data.message,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.bookings.push(booking);
    return booking;
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.findById(id);
    if (!booking) throw new Error('Booking not found');

    let updated: Booking;
    switch (status) {
      case BookingStatus.CONFIRMADA:
        updated = booking.confirm();
        break;
      case BookingStatus.CANCELADA:
        updated = booking.cancel();
        break;
      case BookingStatus.CONCLUIDA:
        updated = booking.complete();
        break;
      default:
        throw new Error('Invalid status transition');
    }

    const index = this.bookings.findIndex((b) => b.id === id);
    this.bookings[index] = updated;
    return updated;
  }

  // Helper for tests
  addBooking(booking: Booking): void {
    this.bookings.push(booking);
  }
}

class InMemoryPropertyRepository implements PropertyRepository {
  private properties: Property[] = [];

  async findById(id: string): Promise<Property | null> {
    return this.properties.find((p) => p.id === id) || null;
  }

  async findAll(filters?: PropertyFilters): Promise<Property[]> {
    return this.properties.filter((p) => p.status === PropertyStatus.ATIVO);
  }

  async findByOwner(ownerId: string): Promise<Property[]> {
    return this.properties.filter((p) => p.ownerId === ownerId);
  }

  async countByOwner(ownerId: string): Promise<number> {
    return this.properties.filter((p) => p.ownerId === ownerId).length;
  }

  async create(data: CreatePropertyData): Promise<Property> {
    const property = new Property({
      id: `property-${this.properties.length + 1}`,
      ownerId: data.ownerId,
      type: data.type as PropertyType,
      status: PropertyStatus.ATIVO,
      title: data.title,
      description: data.description,
      price: data.price,
      pricePerNight: data.pricePerNight,
      minNights: data.minNights,
      maxGuests: data.maxGuests,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.properties.push(property);
    return property;
  }

  async update(id: string, data: UpdatePropertyData): Promise<Property> {
    const property = await this.findById(id);
    if (!property) throw new Error('Property not found');
    // For testing purposes, just return the property
    return property;
  }

  async updateStatus(id: string, status: string): Promise<Property> {
    const property = await this.findById(id);
    if (!property) throw new Error('Property not found');

    let updated: Property;
    switch (status) {
      case PropertyStatus.PAUSADO:
        updated = property.pause();
        break;
      case PropertyStatus.ATIVO:
        updated = property.activate();
        break;
      case PropertyStatus.REMOVIDO:
        updated = property.remove();
        break;
      default:
        throw new Error('Invalid status');
    }

    const index = this.properties.findIndex((p) => p.id === id);
    this.properties[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    const index = this.properties.findIndex((p) => p.id === id);
    if (index >= 0) this.properties.splice(index, 1);
  }

  async hasConflictingBooking(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<boolean> {
    return false;
  }

  // Image methods - required by interface
  async findImagesByPropertyId(propertyId: string): Promise<any[]> {
    return [];
  }

  async findImageById(imageId: string, propertyId: string): Promise<any | null> {
    return null;
  }

  async createImage(data: any): Promise<any> {
    return { id: 'image-1', ...data };
  }

  async deleteImage(imageId: string): Promise<void> {
    // noop for tests
  }

  async clearImagePrimary(propertyId: string): Promise<void> {
    // noop for tests
  }

  async setImagePrimary(imageId: string): Promise<void> {
    // noop for tests
  }

  // Helper for tests
  addProperty(property: Property): void {
    this.properties.push(property);
  }
}

class InMemoryActivityRepository implements ActivityRepository {
  private activities: any[] = [];

  async create(data: CreateActivityData): Promise<any> {
    const activity = { id: `activity-${this.activities.length + 1}`, ...data, createdAt: new Date() };
    this.activities.push(activity);
    return activity;
  }

  async findByUser(userId: string): Promise<any[]> {
    return this.activities.filter((a) => a.userId === userId);
  }

  getActivities(): any[] {
    return this.activities;
  }
}

describe('CreateBookingUseCase', () => {
  let useCase: CreateBookingUseCase;
  let bookingRepository: InMemoryBookingRepository;
  let propertyRepository: InMemoryPropertyRepository;
  let activityRepository: InMemoryActivityRepository;
  let testProperty: Property;

  beforeEach(() => {
    bookingRepository = new InMemoryBookingRepository();
    propertyRepository = new InMemoryPropertyRepository();
    activityRepository = new InMemoryActivityRepository();
    useCase = new CreateBookingUseCase(
      bookingRepository,
      propertyRepository,
      activityRepository,
    );

    // Create test property
    testProperty = new Property({
      id: 'property-1',
      ownerId: 'owner-1',
      title: 'Beach House',
      description: 'Beautiful beach house',
      type: PropertyType.TEMPORADA,
      status: PropertyStatus.ATIVO,
      pricePerNight: 500,
      minNights: 2,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
      city: 'Florianópolis',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    propertyRepository.addProperty(testProperty);
  });

  const validInput: CreateBookingInput = {
    propertyId: 'property-1',
    guestId: 'guest-1',
    checkIn: '2025-03-01',
    checkOut: '2025-03-05',
    adults: 2,
    children: 1,
    message: 'Looking forward to staying!',
  };

  describe('Happy Path', () => {
    it('should create a booking with valid data', async () => {
      const booking = await useCase.execute(validInput);

      expect(booking).toBeInstanceOf(Booking);
      expect(booking.id).toBeDefined();
      expect(booking.propertyId).toBe('property-1');
      expect(booking.guestId).toBe('guest-1');
      expect(booking.ownerId).toBe('owner-1');
      expect(booking.status).toBe(BookingStatus.PENDENTE);
      expect(booking.adults).toBe(2);
      expect(booking.children).toBe(1);
      expect(booking.guests).toBe(3);
      expect(booking.message).toBe('Looking forward to staying!');
    });

    it('should calculate total nights correctly', async () => {
      const booking = await useCase.execute(validInput);

      expect(booking.totalNights).toBe(4); // March 1-5 = 4 nights
    });

    it('should calculate prices correctly', async () => {
      const booking = await useCase.execute(validInput);

      // 4 nights * 500/night = 2000
      // Cleaning fee = 30% of pricePerNight = 150
      // Service fee = 10% of subtotal = 200
      // Total = 2000 + 150 + 200 = 2350
      expect(booking.pricePerNight).toBe(500);
      expect(booking.totalNights).toBe(4);
      expect(booking.cleaningFee).toBe(150);
      expect(booking.serviceFee).toBe(200);
      expect(booking.totalPrice).toBe(2350);
    });

    it('should create activity for booking', async () => {
      await useCase.execute(validInput);

      const activities = activityRepository.getActivities();
      expect(activities).toHaveLength(1);
      expect(activities[0].userId).toBe('guest-1');
      expect(activities[0].type).toBe('RESERVA_CRIADA');
      expect(activities[0].propertyId).toBe('property-1');
    });

    it('should work without activity repository', async () => {
      const useCaseNoActivity = new CreateBookingUseCase(
        bookingRepository,
        propertyRepository,
      );

      const booking = await useCaseNoActivity.execute(validInput);
      expect(booking).toBeInstanceOf(Booking);
    });
  });

  describe('Property Validation', () => {
    it('should throw PropertyNotFoundError if property does not exist', async () => {
      const input = { ...validInput, propertyId: 'non-existent' };

      await expect(useCase.execute(input)).rejects.toThrow(PropertyNotFoundError);
    });

    it('should throw PropertyNotAvailableError if property is PAUSADO', async () => {
      const pausedProperty = new Property({
        id: 'paused-property',
        ownerId: 'owner-1',
        title: 'Paused Property',
        type: PropertyType.TEMPORADA,
        status: PropertyStatus.PAUSADO,
        pricePerNight: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      propertyRepository.addProperty(pausedProperty);

      const input = { ...validInput, propertyId: 'paused-property' };

      await expect(useCase.execute(input)).rejects.toThrow(PropertyNotAvailableError);
    });

    it('should throw PropertyNotAvailableError if property is REMOVIDO', async () => {
      const removedProperty = new Property({
        id: 'removed-property',
        ownerId: 'owner-1',
        title: 'Removed Property',
        type: PropertyType.TEMPORADA,
        status: PropertyStatus.REMOVIDO,
        pricePerNight: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      propertyRepository.addProperty(removedProperty);

      const input = { ...validInput, propertyId: 'removed-property' };

      await expect(useCase.execute(input)).rejects.toThrow(PropertyNotAvailableError);
    });
  });

  describe('Date Validation', () => {
    it('should throw MinNightsRequiredError if stay is too short', async () => {
      const input = {
        ...validInput,
        checkIn: '2025-03-01',
        checkOut: '2025-03-02', // Only 1 night, but minNights is 2
      };

      await expect(useCase.execute(input)).rejects.toThrow(MinNightsRequiredError);
    });

    it('should accept booking that meets minimum nights', async () => {
      const input = {
        ...validInput,
        checkIn: '2025-03-01',
        checkOut: '2025-03-03', // Exactly 2 nights (minimum)
      };

      const booking = await useCase.execute(input);
      expect(booking.totalNights).toBe(2);
    });
  });

  describe('Guest Validation', () => {
    it('should throw MaxGuestsExceededError if too many guests', async () => {
      const input = {
        ...validInput,
        adults: 5,
        children: 3, // Total 8, but max is 6
      };

      await expect(useCase.execute(input)).rejects.toThrow(MaxGuestsExceededError);
    });

    it('should accept booking at max capacity', async () => {
      const input = {
        ...validInput,
        adults: 4,
        children: 2, // Total 6, exactly at max
      };

      const booking = await useCase.execute(input);
      expect(booking.guests).toBe(6);
    });
  });

  describe('Availability Validation', () => {
    it('should throw DatesUnavailableError if dates conflict with existing booking', async () => {
      // Create existing booking
      const existingBooking = new Booking({
        id: 'existing-booking',
        propertyId: 'property-1',
        guestId: 'other-guest',
        ownerId: 'owner-1',
        checkIn: new Date('2025-03-03'),
        checkOut: new Date('2025-03-07'),
        guests: 2,
        adults: 2,
        children: 0,
        totalNights: 4,
        pricePerNight: 500,
        cleaningFee: 150,
        serviceFee: 215,
        totalPrice: 2365,
        status: BookingStatus.CONFIRMADA,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      bookingRepository.addBooking(existingBooking);

      // Try to book overlapping dates
      const input = {
        ...validInput,
        checkIn: '2025-03-01',
        checkOut: '2025-03-05', // Overlaps with existing (March 3-5)
      };

      await expect(useCase.execute(input)).rejects.toThrow(DatesUnavailableError);
    });

    it('should allow booking after existing booking ends', async () => {
      // Create existing booking
      const existingBooking = new Booking({
        id: 'existing-booking',
        propertyId: 'property-1',
        guestId: 'other-guest',
        ownerId: 'owner-1',
        checkIn: new Date('2025-03-01'),
        checkOut: new Date('2025-03-05'),
        guests: 2,
        adults: 2,
        children: 0,
        totalNights: 4,
        pricePerNight: 500,
        cleaningFee: 150,
        serviceFee: 215,
        totalPrice: 2365,
        status: BookingStatus.CONFIRMADA,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      bookingRepository.addBooking(existingBooking);

      // Book starting when existing ends
      const input = {
        ...validInput,
        checkIn: '2025-03-05', // Same day existing checkout
        checkOut: '2025-03-09',
      };

      const booking = await useCase.execute(input);
      expect(booking).toBeInstanceOf(Booking);
    });

    it('should allow booking when existing is cancelled', async () => {
      // Create cancelled booking
      const cancelledBooking = new Booking({
        id: 'cancelled-booking',
        propertyId: 'property-1',
        guestId: 'other-guest',
        ownerId: 'owner-1',
        checkIn: new Date('2025-03-01'),
        checkOut: new Date('2025-03-05'),
        guests: 2,
        adults: 2,
        children: 0,
        totalNights: 4,
        pricePerNight: 500,
        cleaningFee: 150,
        serviceFee: 215,
        totalPrice: 2365,
        status: BookingStatus.CANCELADA,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      bookingRepository.addBooking(cancelledBooking);

      // Book same dates (should work because existing is cancelled)
      const booking = await useCase.execute(validInput);
      expect(booking).toBeInstanceOf(Booking);
    });
  });
});
