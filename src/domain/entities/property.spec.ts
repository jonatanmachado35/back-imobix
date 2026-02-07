import { Property, PropertyType, PropertyStatus, InvalidPropertyDataError } from './property';

describe('Property Entity', () => {
  const validTemporadaProps = {
    id: 'prop-123',
    ownerId: 'user-123',
    type: PropertyType.TEMPORADA,
    status: PropertyStatus.ATIVO,
    title: 'Casa na Praia',
    description: 'Linda casa de praia',
    pricePerNight: 500,
    city: 'Florianópolis',
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 8,
    minNights: 2,
    amenities: ['wifi', 'piscina'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validVendaProps = {
    id: 'prop-456',
    ownerId: 'user-123',
    type: PropertyType.VENDA,
    status: PropertyStatus.ATIVO,
    title: 'Apartamento Centro',
    description: 'Apartamento bem localizado',
    price: 500000,
    city: 'São Paulo',
    bedrooms: 2,
    bathrooms: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Creation', () => {
    it('should create a valid TEMPORADA property', () => {
      const property = new Property(validTemporadaProps);

      expect(property.id).toBe('prop-123');
      expect(property.ownerId).toBe('user-123');
      expect(property.type).toBe(PropertyType.TEMPORADA);
      expect(property.title).toBe('Casa na Praia');
      expect(property.pricePerNight).toBe(500);
      expect(property.maxGuests).toBe(8);
    });

    it('should create a valid VENDA property', () => {
      const property = new Property(validVendaProps);

      expect(property.id).toBe('prop-456');
      expect(property.type).toBe(PropertyType.VENDA);
      expect(property.price).toBe(500000);
    });

    it('should create a valid ALUGUEL property', () => {
      const props = {
        ...validVendaProps,
        id: 'prop-789',
        type: PropertyType.ALUGUEL,
        price: 3000,
      };
      const property = new Property(props);

      expect(property.type).toBe(PropertyType.ALUGUEL);
      expect(property.price).toBe(3000);
    });
  });

  describe('Validation', () => {
    it('should throw if title is empty', () => {
      const props = { ...validTemporadaProps, title: '' };

      expect(() => new Property(props)).toThrow(InvalidPropertyDataError);
      expect(() => new Property(props)).toThrow('Title is required');
    });

    it('should throw if title is only whitespace', () => {
      const props = { ...validTemporadaProps, title: '   ' };

      expect(() => new Property(props)).toThrow(InvalidPropertyDataError);
    });

    it('should throw if TEMPORADA without pricePerNight', () => {
      const props = { ...validTemporadaProps, pricePerNight: null };

      expect(() => new Property(props)).toThrow(InvalidPropertyDataError);
      expect(() => new Property(props)).toThrow('pricePerNight is required for TEMPORADA');
    });

    it('should throw if TEMPORADA with pricePerNight <= 0', () => {
      const props = { ...validTemporadaProps, pricePerNight: 0 };

      expect(() => new Property(props)).toThrow(InvalidPropertyDataError);
    });

    it('should throw if VENDA without price', () => {
      const props = { ...validVendaProps, price: null };

      expect(() => new Property(props)).toThrow(InvalidPropertyDataError);
      expect(() => new Property(props)).toThrow('price is required for VENDA/ALUGUEL');
    });

    it('should throw if ALUGUEL with price <= 0', () => {
      const props = { ...validVendaProps, type: PropertyType.ALUGUEL, price: 0 };

      expect(() => new Property(props)).toThrow(InvalidPropertyDataError);
    });
  });

  describe('Status Transitions', () => {
    it('should pause an active property', () => {
      const property = new Property(validTemporadaProps);
      const paused = property.pause();

      expect(paused.status).toBe(PropertyStatus.PAUSADO);
      expect(paused.id).toBe(property.id);
    });

    it('should activate a paused property', () => {
      const paused = new Property({ ...validTemporadaProps, status: PropertyStatus.PAUSADO });
      const active = paused.activate();

      expect(active.status).toBe(PropertyStatus.ATIVO);
    });

    it('should remove an active property', () => {
      const property = new Property(validTemporadaProps);
      const removed = property.remove();

      expect(removed.status).toBe(PropertyStatus.REMOVIDO);
    });

    it('should throw when trying to pause a removed property', () => {
      const removed = new Property({ ...validTemporadaProps, status: PropertyStatus.REMOVIDO });

      expect(() => removed.pause()).toThrow('Cannot pause a removed property');
    });

    it('should throw when trying to activate a removed property', () => {
      const removed = new Property({ ...validTemporadaProps, status: PropertyStatus.REMOVIDO });

      expect(() => removed.activate()).toThrow('Cannot activate a removed property');
    });
  });

  describe('Availability', () => {
    it('should be available for booking when ATIVO', () => {
      const property = new Property(validTemporadaProps);

      expect(property.isAvailableForBooking()).toBe(true);
    });

    it('should not be available for booking when PAUSADO', () => {
      const property = new Property({ ...validTemporadaProps, status: PropertyStatus.PAUSADO });

      expect(property.isAvailableForBooking()).toBe(false);
    });

    it('should not be available for booking when REMOVIDO', () => {
      const property = new Property({ ...validTemporadaProps, status: PropertyStatus.REMOVIDO });

      expect(property.isAvailableForBooking()).toBe(false);
    });
  });
});
