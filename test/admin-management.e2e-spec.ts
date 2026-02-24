import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Admin Management E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;

  const testSuffix = `admin-e2e-${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        nome: 'Admin E2E',
        email: `admin-${testSuffix}@test.com`,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    adminUserId = adminUser.id;

    // Create regular user
    const regularUser = await prisma.user.create({
      data: {
        nome: 'Regular User E2E',
        email: `user-${testSuffix}@test.com`,
        passwordHash: hashedPassword,
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    regularUserId = regularUser.id;

    // Login as admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminUser.email, password: 'Test@123' });

    if (!adminLogin.body.access_token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.body)}`);
    }
    adminToken = adminLogin.body.access_token;

    // Login as regular user
    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: regularUser.email, password: 'Test@123' });

    if (!userLogin.body.access_token) {
      throw new Error(`User login failed: ${JSON.stringify(userLogin.body)}`);
    }
    userToken = userLogin.body.access_token;
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      // Clean up audit logs first (FK constraint)
      await prisma.adminAuditLog.deleteMany({
        where: {
          OR: [
            { adminId: adminUserId },
            { targetUserId: { in: [regularUserId, adminUserId] } },
          ],
        },
      }).catch(() => { });

      // Clean up test users
      await prisma.user.deleteMany({
        where: { email: { contains: testSuffix } },
      }).catch(() => { });
    }
    if (app) {
      await app.close();
    }
  });

  // ==========================================
  // 1. List Users (with filters and pagination)
  // ==========================================

  describe('GET /admin/users', () => {
    it('should list users with filters and pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('totalPages');

      // Verify our test users are in the list
      const emails = response.body.data.map((u: any) => u.email);
      expect(emails).toContain(`admin-${testSuffix}@test.com`);
      expect(emails).toContain(`user-${testSuffix}@test.com`);
    });
  });

  // ==========================================
  // 2. Promote user to admin
  // ==========================================

  describe('PATCH /admin/users/:userId/promote', () => {
    let promotableUserId: string;

    beforeAll(async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const promotableUser = await prisma.user.create({
        data: {
          nome: 'Promotable User',
          email: `promotable-${testSuffix}@test.com`,
          passwordHash: hashedPassword,
          role: 'USER',
          status: 'ACTIVE',
        },
      });
      promotableUserId = promotableUser.id;
    });

    it('should promote a user to admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${promotableUserId}/promote`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.role).toBe('ADMIN');
      expect(response.body.message).toBe('Usuario promovido a admin');

      // Verify in database
      const dbUser = await prisma.user.findUnique({ where: { id: promotableUserId } });
      expect(dbUser!.role).toBe('ADMIN');
    });

    // ==========================================
    // 3. Try to promote someone who is already admin (409)
    // ==========================================

    it('should return 409 when trying to promote someone already admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${promotableUserId}/promote`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
    });

    // ==========================================
    // 4. Try to promote a blocked user (422)
    // ==========================================

    it('should return 422 when trying to promote a blocked user', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const blockedForPromotion = await prisma.user.create({
        data: {
          nome: 'Blocked For Promotion',
          email: `blocked-promote-${testSuffix}@test.com`,
          passwordHash: hashedPassword,
          role: 'USER',
          status: 'BLOCKED',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${blockedForPromotion.id}/promote`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(422);
    });
  });

  // ==========================================
  // 5. Block user
  // ==========================================

  describe('PATCH /admin/users/:userId/block', () => {
    let blockableUserId: string;

    beforeAll(async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const blockableUser = await prisma.user.create({
        data: {
          nome: 'Blockable User',
          email: `blockable-${testSuffix}@test.com`,
          passwordHash: hashedPassword,
          role: 'USER',
          status: 'ACTIVE',
        },
      });
      blockableUserId = blockableUser.id;
    });

    it('should block a user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${blockableUserId}/block`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('blocked');
      expect(response.body.message).toBe('Usuario bloqueado');

      // Verify in database
      const dbUser = await prisma.user.findUnique({ where: { id: blockableUserId } });
      expect(dbUser!.status).toBe('BLOCKED');
      expect(dbUser!.refreshToken).toBeNull();
    });

    // ==========================================
    // 6. Try to block an admin (422)
    // ==========================================

    it('should return 422 when trying to block an admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${adminUserId}/block`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(422);
    });

    // ==========================================
    // 7. Try to block someone already blocked (409)
    // ==========================================

    it('should return 409 when trying to block someone already blocked', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${blockableUserId}/block`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
    });
  });

  // ==========================================
  // 8. Unblock user
  // ==========================================

  describe('PATCH /admin/users/:userId/unblock', () => {
    let unblockableUserId: string;

    beforeAll(async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const unblockableUser = await prisma.user.create({
        data: {
          nome: 'Unblockable User',
          email: `unblockable-${testSuffix}@test.com`,
          passwordHash: hashedPassword,
          role: 'USER',
          status: 'BLOCKED',
        },
      });
      unblockableUserId = unblockableUser.id;
    });

    it('should unblock a blocked user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${unblockableUserId}/unblock`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('active');
      expect(response.body.message).toBe('Usuario desbloqueado');

      // Verify in database
      const dbUser = await prisma.user.findUnique({ where: { id: unblockableUserId } });
      expect(dbUser!.status).toBe('ACTIVE');
    });
  });

  // ==========================================
  // 9. Blocked user tries to login (403)
  // ==========================================

  describe('Blocked user login', () => {
    it('should return 403 when a blocked user tries to login', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const blockedLoginUser = await prisma.user.create({
        data: {
          nome: 'Blocked Login User',
          email: `blocked-login-${testSuffix}@test.com`,
          passwordHash: hashedPassword,
          role: 'USER',
          status: 'BLOCKED',
        },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: blockedLoginUser.email, password: 'Test@123' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('bloqueada');
    });
  });

  // ==========================================
  // 10. Verify audit log records created
  // ==========================================

  describe('Audit logs', () => {
    it('should have created audit log records for admin actions', async () => {
      const auditLogs = await prisma.adminAuditLog.findMany({
        where: { adminId: adminUserId },
        orderBy: { createdAt: 'asc' },
      });

      // We performed promote, block, and unblock actions above
      expect(auditLogs.length).toBeGreaterThanOrEqual(3);

      const actions = auditLogs.map((log) => log.action);
      expect(actions).toContain('PROMOTE_TO_ADMIN');
      expect(actions).toContain('BLOCK_USER');
      expect(actions).toContain('UNBLOCK_USER');

      // Verify audit log structure
      for (const log of auditLogs) {
        expect(log.id).toBeTruthy();
        expect(log.adminId).toBe(adminUserId);
        expect(log.targetUserId).toBeTruthy();
        expect(log.createdAt).toBeTruthy();
      }
    });
  });

  // ==========================================
  // 11. Endpoints without authentication (401)
  // ==========================================

  describe('Authentication required', () => {
    it('should return 401 for all admin endpoints without authentication', async () => {
      const endpoints = [
        { method: 'get', path: '/admin/users' },
        { method: 'patch', path: `/admin/users/${regularUserId}/promote` },
        { method: 'patch', path: `/admin/users/${regularUserId}/block` },
        { method: 'patch', path: `/admin/users/${regularUserId}/unblock` },
      ];

      for (const endpoint of endpoints) {
        const response = await (request(app.getHttpServer()) as any)
          [endpoint.method](endpoint.path);

        expect(response.status).toBe(401);
      }
    });
  });

  // ==========================================
  // 12. Endpoints with non-admin user (403)
  // ==========================================

  describe('Admin authorization required', () => {
    it('should return 403 for all admin endpoints with non-admin user', async () => {
      const endpoints = [
        { method: 'get', path: '/admin/users' },
        { method: 'patch', path: `/admin/users/${regularUserId}/promote` },
        { method: 'patch', path: `/admin/users/${regularUserId}/block` },
        { method: 'patch', path: `/admin/users/${regularUserId}/unblock` },
      ];

      for (const endpoint of endpoints) {
        const response = await (request(app.getHttpServer()) as any)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(403);
      }
    });
  });
});
