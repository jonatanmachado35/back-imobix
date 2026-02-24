import { Test, TestingModule } from '@nestjs/testing';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaService } from './prisma.service';
import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/entities/user';

const TEST_EMAIL_SUFFIX = '@test-repo-integration.com';

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
    // Cleanup: delete audit logs first (FK constraint), then test users
    await prisma.adminAuditLog.deleteMany({
      where: {
        OR: [
          { admin: { email: { contains: TEST_EMAIL_SUFFIX } } },
          { targetUser: { email: { contains: TEST_EMAIL_SUFFIX } } },
        ],
      },
    }).catch(() => { });

    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: '@test-phone-update.com' } },
          { email: { contains: TEST_EMAIL_SUFFIX } },
        ],
      },
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

  // ==========================================
  // Admin Management: findAll() tests
  // ==========================================

  describe('findAll method', () => {
    const createTestUser = async (overrides: {
      nome?: string;
      email: string;
      role?: 'USER' | 'ADMIN';
      status?: 'ACTIVE' | 'BLOCKED';
    }) => {
      return prisma.user.create({
        data: {
          nome: overrides.nome || 'Test User',
          email: overrides.email,
          passwordHash: 'hash123',
          role: overrides.role || 'USER',
          status: overrides.status || 'ACTIVE',
          userRole: 'cliente',
        },
      });
    };

    it('should return all users with default pagination', async () => {
      // Arrange: Create 3 test users
      await createTestUser({ email: `findall-1${TEST_EMAIL_SUFFIX}` });
      await createTestUser({ email: `findall-2${TEST_EMAIL_SUFFIX}` });
      await createTestUser({ email: `findall-3${TEST_EMAIL_SUFFIX}` });

      // Act
      const result = await repository.findAll({ page: 1, limit: 100 });

      // Assert: Should contain at least our 3 users
      expect(result.data.length).toBeGreaterThanOrEqual(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(100);
      expect(result.meta.total).toBeGreaterThanOrEqual(3);
      expect(result.meta.totalPages).toBeGreaterThanOrEqual(1);

      // All returned items should be User domain entities
      for (const user of result.data) {
        expect(user).toBeInstanceOf(User);
      }
    });

    it('should filter users by role', async () => {
      // Arrange: Create users with different roles
      await createTestUser({ email: `role-user${TEST_EMAIL_SUFFIX}`, role: 'USER' });
      await createTestUser({ email: `role-admin${TEST_EMAIL_SUFFIX}`, role: 'ADMIN' });

      // Act: Filter by ADMIN role
      const result = await repository.findAll({ role: 'ADMIN', limit: 100 });

      // Assert: Should only contain ADMIN users
      const testEmails = result.data
        .filter((u) => u.email.includes(TEST_EMAIL_SUFFIX))
        .map((u) => u.email);
      expect(testEmails).toContain(`role-admin${TEST_EMAIL_SUFFIX}`);
      expect(testEmails).not.toContain(`role-user${TEST_EMAIL_SUFFIX}`);

      for (const user of result.data) {
        expect(user.role).toBe('ADMIN');
      }
    });

    it('should filter users by status', async () => {
      // Arrange: Create users with different statuses
      await createTestUser({ email: `status-active${TEST_EMAIL_SUFFIX}`, status: 'ACTIVE' });
      await createTestUser({ email: `status-blocked${TEST_EMAIL_SUFFIX}`, status: 'BLOCKED' });

      // Act: Filter by blocked status (API uses lowercase)
      const result = await repository.findAll({ status: 'blocked', limit: 100 });

      // Assert: Should only contain BLOCKED users
      const testEmails = result.data
        .filter((u) => u.email.includes(TEST_EMAIL_SUFFIX))
        .map((u) => u.email);
      expect(testEmails).toContain(`status-blocked${TEST_EMAIL_SUFFIX}`);
      expect(testEmails).not.toContain(`status-active${TEST_EMAIL_SUFFIX}`);

      for (const user of result.data) {
        expect(user.status).toBe('BLOCKED');
      }
    });

    it('should search users by name and email (case-insensitive)', async () => {
      // Arrange: Create users with specific names
      await createTestUser({
        nome: 'João Silva',
        email: `search-joao${TEST_EMAIL_SUFFIX}`,
      });
      await createTestUser({
        nome: 'Maria Santos',
        email: `search-maria${TEST_EMAIL_SUFFIX}`,
      });

      // Act: Search by partial name (case-insensitive)
      const resultByName = await repository.findAll({ search: 'joão', limit: 100 });
      const nameEmails = resultByName.data.map((u) => u.email);
      expect(nameEmails).toContain(`search-joao${TEST_EMAIL_SUFFIX}`);
      expect(nameEmails).not.toContain(`search-maria${TEST_EMAIL_SUFFIX}`);

      // Act: Search by partial email
      const resultByEmail = await repository.findAll({ search: 'search-maria', limit: 100 });
      const emailEmails = resultByEmail.data.map((u) => u.email);
      expect(emailEmails).toContain(`search-maria${TEST_EMAIL_SUFFIX}`);
      expect(emailEmails).not.toContain(`search-joao${TEST_EMAIL_SUFFIX}`);
    });

    it('should paginate results correctly', async () => {
      // Arrange: Create 5 users
      for (let i = 1; i <= 5; i++) {
        await createTestUser({ email: `page-${i}${TEST_EMAIL_SUFFIX}` });
      }

      // Act: Get page 1 with limit 2
      const page1 = await repository.findAll({ page: 1, limit: 2 });

      // Assert
      expect(page1.data.length).toBe(2);
      expect(page1.meta.page).toBe(1);
      expect(page1.meta.limit).toBe(2);
      expect(page1.meta.totalPages).toBeGreaterThanOrEqual(3); // at least 5 users / 2 per page

      // Act: Get page 2
      const page2 = await repository.findAll({ page: 2, limit: 2 });
      expect(page2.data.length).toBe(2);
      expect(page2.meta.page).toBe(2);

      // Verify pages contain different users
      const page1Ids = page1.data.map((u) => u.id);
      const page2Ids = page2.data.map((u) => u.id);
      for (const id of page1Ids) {
        expect(page2Ids).not.toContain(id);
      }
    });
  });

  // ==========================================
  // Admin Management: save() with status tests
  // ==========================================

  describe('save method (status and role)', () => {
    it('should persist status change correctly', async () => {
      // Arrange: Create a user with ACTIVE status
      const createdUser = await prisma.user.create({
        data: {
          nome: 'Save Status Test',
          email: `save-status${TEST_EMAIL_SUFFIX}`,
          passwordHash: 'hash123',
          role: 'USER',
          status: 'ACTIVE',
          userRole: 'cliente',
        },
      });

      // Load via repository to get domain entity
      const domainUser = await repository.findById(createdUser.id);
      expect(domainUser).not.toBeNull();
      expect(domainUser!.status).toBe('ACTIVE');

      // Act: Block the user (domain method) and save
      const blockedUser = domainUser!.block();
      await repository.save(blockedUser);

      // Assert: Verify in database directly
      const dbUser = await prisma.user.findUnique({ where: { id: createdUser.id } });
      expect(dbUser!.status).toBe('BLOCKED');

      // Also verify via repository findById
      const reloaded = await repository.findById(createdUser.id);
      expect(reloaded!.status).toBe('BLOCKED');
      expect(reloaded!.isBlocked).toBe(true);
    });

    it('should persist role change correctly', async () => {
      // Arrange: Create a regular user
      const createdUser = await prisma.user.create({
        data: {
          nome: 'Save Role Test',
          email: `save-role${TEST_EMAIL_SUFFIX}`,
          passwordHash: 'hash123',
          role: 'USER',
          status: 'ACTIVE',
          userRole: 'cliente',
        },
      });

      // Load via repository to get domain entity
      const domainUser = await repository.findById(createdUser.id);
      expect(domainUser).not.toBeNull();
      expect(domainUser!.role).toBe('USER');

      // Act: Promote to admin (domain method) and save
      const adminUser = domainUser!.promoteToAdmin();
      await repository.save(adminUser);

      // Assert: Verify in database directly
      const dbUser = await prisma.user.findUnique({ where: { id: createdUser.id } });
      expect(dbUser!.role).toBe('ADMIN');

      // Also verify via repository findById
      const reloaded = await repository.findById(createdUser.id);
      expect(reloaded!.role).toBe('ADMIN');
      expect(reloaded!.isAdmin).toBe(true);
    });
  });

  // ==========================================
  // Admin Management: saveWithAuditLog() tests
  // ==========================================

  describe('saveWithAuditLog method', () => {
    it('should save user and create audit log in a single transaction', async () => {
      // Arrange: Create admin and target users
      const adminUser = await prisma.user.create({
        data: {
          nome: 'Admin For Audit',
          email: `audit-admin${TEST_EMAIL_SUFFIX}`,
          passwordHash: 'hash123',
          role: 'ADMIN',
          status: 'ACTIVE',
          userRole: 'cliente',
        },
      });

      const targetUser = await prisma.user.create({
        data: {
          nome: 'Target For Audit',
          email: `audit-target${TEST_EMAIL_SUFFIX}`,
          passwordHash: 'hash123',
          role: 'USER',
          status: 'ACTIVE',
          userRole: 'cliente',
        },
      });

      // Load domain entity and block
      const domainTarget = await repository.findById(targetUser.id);
      const blockedTarget = domainTarget!.block();

      // Act: Save with audit log
      await repository.saveWithAuditLog(
        blockedTarget,
        {
          adminId: adminUser.id,
          targetUserId: targetUser.id,
          action: 'BLOCK_USER',
          details: 'Blocked during integration test',
        },
      );

      // Assert: User status updated
      const dbUser = await prisma.user.findUnique({ where: { id: targetUser.id } });
      expect(dbUser!.status).toBe('BLOCKED');

      // Assert: Audit log created
      const auditLogs = await prisma.adminAuditLog.findMany({
        where: { targetUserId: targetUser.id },
      });
      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].adminId).toBe(adminUser.id);
      expect(auditLogs[0].action).toBe('BLOCK_USER');
      expect(auditLogs[0].details).toBe('Blocked during integration test');
    });

    it('should invalidate refresh token when option is set', async () => {
      // Arrange: Create admin and target user with refresh token
      const adminUser = await prisma.user.create({
        data: {
          nome: 'Admin For Token Test',
          email: `token-admin${TEST_EMAIL_SUFFIX}`,
          passwordHash: 'hash123',
          role: 'ADMIN',
          status: 'ACTIVE',
          userRole: 'cliente',
        },
      });

      const targetUser = await prisma.user.create({
        data: {
          nome: 'Target With Token',
          email: `token-target${TEST_EMAIL_SUFFIX}`,
          passwordHash: 'hash123',
          role: 'USER',
          status: 'ACTIVE',
          userRole: 'cliente',
          refreshToken: 'some-valid-refresh-token',
        },
      });

      // Verify refresh token exists
      const beforeBlock = await prisma.user.findUnique({ where: { id: targetUser.id } });
      expect(beforeBlock!.refreshToken).toBe('some-valid-refresh-token');

      // Load domain entity and block
      const domainTarget = await repository.findById(targetUser.id);
      const blockedTarget = domainTarget!.block();

      // Act: Save with audit log AND invalidate refresh token
      await repository.saveWithAuditLog(
        blockedTarget,
        {
          adminId: adminUser.id,
          targetUserId: targetUser.id,
          action: 'BLOCK_USER',
        },
        { invalidateRefreshToken: true },
      );

      // Assert: Refresh token is null
      const dbUser = await prisma.user.findUnique({ where: { id: targetUser.id } });
      expect(dbUser!.status).toBe('BLOCKED');
      expect(dbUser!.refreshToken).toBeNull();
    });
  });
});
