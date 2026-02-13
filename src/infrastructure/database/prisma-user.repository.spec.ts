import { Test, TestingModule } from '@nestjs/testing';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaService } from './prisma.service';
import { User as PrismaUser } from '@prisma/client';

describe('PrismaUserRepository (Integration)', () => {
  let repository: PrismaUserRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaUserRepository, PrismaService],
    }).compile();

    repository = module.get<PrismaUserRepository>(PrismaUserRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Cleanup: delete all test users
    await prisma.user.deleteMany({
      where: {
        email: { contains: '@test-phone-update.com' }
      }
    });
  });

  describe('update method', () => {
    it('should update phone field correctly', async () => {
      // Arrange: Create a test user
      const createdUser = await prisma.user.create({
        data: {
          nome: 'Test User',
          email: 'testuser@test-phone-update.com',
          passwordHash: 'hash123',
          role: 'USER',
          userRole: 'cliente',
          phone: null,
        }
      });

      // Act: Update user with phone
      const updatedUser = await repository.update(createdUser.id, {
        nome: 'Test User',
        email: 'testuser@test-phone-update.com',
        phone: '51988888888',
        avatar: null,
      });

      // Assert: Phone should be updated
      expect(updatedUser.phone).toBe('51988888888');

      // Double check by reading from database directly
      const userFromDb = await prisma.user.findUnique({
        where: { id: createdUser.id }
      });
      expect(userFromDb?.phone).toBe('51988888888');
    });

    it('should update avatar field correctly', async () => {
      // Arrange: Create a test user
      const createdUser = await prisma.user.create({
        data: {
          nome: 'Test User 2',
          email: 'testuser2@test-phone-update.com',
          passwordHash: 'hash123',
          role: 'USER',
          userRole: 'cliente',
          avatar: null,
        }
      });

      // Act: Update user with avatar
      const updatedUser = await repository.update(createdUser.id, {
        nome: 'Test User 2',
        email: 'testuser2@test-phone-update.com',
        phone: null,
        avatar: 'https://example.com/avatar.jpg',
      });

      // Assert: Avatar should be updated
      expect(updatedUser.avatar).toBe('https://example.com/avatar.jpg');

      // Double check by reading from database directly
      const userFromDb = await prisma.user.findUnique({
        where: { id: createdUser.id }
      });
      expect(userFromDb?.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should update all fields at once', async () => {
      // Arrange: Create a test user
      const createdUser = await prisma.user.create({
        data: {
          nome: 'Old Name',
          email: 'old@test-phone-update.com',
          passwordHash: 'hash123',
          role: 'USER',
          userRole: 'cliente',
          phone: null,
          avatar: null,
        }
      });

      // Act: Update all fields
      const updatedUser = await repository.update(createdUser.id, {
        nome: 'New Name',
        email: 'new@test-phone-update.com',
        phone: '11999999999',
        avatar: 'https://example.com/new.jpg',
      });

      // Assert: All fields should be updated
      expect(updatedUser.nome).toBe('New Name');
      expect(updatedUser.email).toBe('new@test-phone-update.com');
      expect(updatedUser.phone).toBe('11999999999');
      expect(updatedUser.avatar).toBe('https://example.com/new.jpg');

      // Double check by reading from database directly
      const userFromDb = await prisma.user.findUnique({
        where: { id: createdUser.id }
      });
      expect(userFromDb?.nome).toBe('New Name');
      expect(userFromDb?.email).toBe('new@test-phone-update.com');
      expect(userFromDb?.phone).toBe('11999999999');
      expect(userFromDb?.avatar).toBe('https://example.com/new.jpg');
    });
  });
});
