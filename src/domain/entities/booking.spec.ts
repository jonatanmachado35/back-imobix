import { Booking, BookingStatus, InvalidBookingError } from './booking';

describe('Booking Entity', () => {
  const validProps = {
    id: 'booking-123',
    propertyId: 'prop-123',
    guestId: 'user-guest',
    ownerId: 'user-owner',
    checkIn: new Date('2026-03-01'),
    checkOut: new Date('2026-03-05'),
    guests: 4,
    adults: 2,
    children: 2,
    totalNights: 4,
    pricePerNight: 500,
    cleaningFee: 150,
    serviceFee: 200,
    totalPrice: 2350,
    status: BookingStatus.PENDENTE,
    message: 'Gostaríamos de passar o feriado aí',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Creation', () => {
    it('should create a valid booking', () => {
      const booking = new Booking(validProps);

      expect(booking.id).toBe('booking-123');
      expect(booking.propertyId).toBe('prop-123');
      expect(booking.guestId).toBe('user-guest');
      expect(booking.ownerId).toBe('user-owner');
      expect(booking.status).toBe(BookingStatus.PENDENTE);
      expect(booking.totalPrice).toBe(2350);
      expect(booking.totalNights).toBe(4);
    });
  });

  describe('Validation', () => {
    it('should throw if checkOut is before checkIn', () => {
      const props = {
        ...validProps,
        checkIn: new Date('2026-03-05'),
        checkOut: new Date('2026-03-01'),
      };

      expect(() => new Booking(props)).toThrow(InvalidBookingError);
      expect(() => new Booking(props)).toThrow('checkOut must be after checkIn');
    });

    it('should throw if checkOut equals checkIn', () => {
      const props = {
        ...validProps,
        checkIn: new Date('2026-03-01'),
        checkOut: new Date('2026-03-01'),
      };

      expect(() => new Booking(props)).toThrow(InvalidBookingError);
    });

    it('should throw if guests is zero or negative', () => {
      const props = { ...validProps, guests: 0 };

      expect(() => new Booking(props)).toThrow(InvalidBookingError);
      expect(() => new Booking(props)).toThrow('guests must be greater than 0');
    });

    it('should throw if totalNights is zero or negative', () => {
      const props = { ...validProps, totalNights: 0 };

      expect(() => new Booking(props)).toThrow(InvalidBookingError);
      expect(() => new Booking(props)).toThrow('totalNights must be greater than 0');
    });
  });

  describe('Status Transitions', () => {
    describe('confirm()', () => {
      it('should confirm a pending booking', () => {
        const booking = new Booking(validProps);
        const confirmed = booking.confirm();

        expect(confirmed.status).toBe(BookingStatus.CONFIRMADA);
      });

      it('should throw when confirming non-pending booking', () => {
        const confirmedBooking = new Booking({ ...validProps, status: BookingStatus.CONFIRMADA });

        expect(() => confirmedBooking.confirm()).toThrow('Only pending bookings can be confirmed');
      });
    });

    describe('cancel()', () => {
      it('should cancel a pending booking (by guest)', () => {
        const booking = new Booking(validProps);
        const cancelled = booking.cancel(false);

        expect(cancelled.status).toBe(BookingStatus.CANCELADA);
      });

      it('should cancel a pending booking (by owner)', () => {
        const booking = new Booking(validProps);
        const cancelled = booking.cancel(true);

        expect(cancelled.status).toBe(BookingStatus.CANCELADA);
      });

      it('should cancel a confirmed booking (by guest only)', () => {
        const confirmed = new Booking({ ...validProps, status: BookingStatus.CONFIRMADA });
        const cancelled = confirmed.cancel(false);

        expect(cancelled.status).toBe(BookingStatus.CANCELADA);
      });

      it('should throw when owner tries to cancel confirmed booking', () => {
        const confirmed = new Booking({ ...validProps, status: BookingStatus.CONFIRMADA });

        expect(() => confirmed.cancel(true)).toThrow('Owner cannot cancel a confirmed booking');
      });

      it('should throw when cancelling already cancelled booking', () => {
        const cancelled = new Booking({ ...validProps, status: BookingStatus.CANCELADA });

        expect(() => cancelled.cancel(false)).toThrow('Booking is already cancelled');
      });

      it('should throw when cancelling completed booking', () => {
        const completed = new Booking({ ...validProps, status: BookingStatus.CONCLUIDA });

        expect(() => completed.cancel(false)).toThrow('Cannot cancel a completed booking');
      });
    });

    describe('complete()', () => {
      it('should complete a confirmed booking after checkout date', () => {
        const pastCheckout = new Date();
        pastCheckout.setDate(pastCheckout.getDate() - 1);
        const pastCheckIn = new Date();
        pastCheckIn.setDate(pastCheckIn.getDate() - 3);

        const booking = new Booking({
          ...validProps,
          status: BookingStatus.CONFIRMADA,
          checkIn: pastCheckIn,
          checkOut: pastCheckout,
        });
        const completed = booking.complete();

        expect(completed.status).toBe(BookingStatus.CONCLUIDA);
      });

      it('should throw when completing non-confirmed booking', () => {
        const pending = new Booking(validProps);

        expect(() => pending.complete()).toThrow('Only confirmed bookings can be completed');
      });

      it('should throw when completing before checkout date', () => {
        const futureCheckIn = new Date();
        futureCheckIn.setDate(futureCheckIn.getDate() + 3);
        const futureCheckout = new Date();
        futureCheckout.setDate(futureCheckout.getDate() + 7);

        const booking = new Booking({
          ...validProps,
          status: BookingStatus.CONFIRMADA,
          checkIn: futureCheckIn,
          checkOut: futureCheckout,
        });

        expect(() => booking.complete()).toThrow('Cannot complete booking before checkout date');
      });
    });
  });

  describe('Price Calculation', () => {
    it('should calculate price correctly', () => {
      const result = Booking.calculatePrice(500, 4);

      expect(result.subtotal).toBe(2000);
      expect(result.cleaningFee).toBe(150); // 500 * 0.3
      expect(result.serviceFee).toBe(200); // 2000 * 0.1
      expect(result.total).toBe(2350);
    });

    it('should handle single night', () => {
      const result = Booking.calculatePrice(300, 1);

      expect(result.subtotal).toBe(300);
      expect(result.cleaningFee).toBe(90);
      expect(result.serviceFee).toBe(30);
      expect(result.total).toBe(420);
    });
  });
});
