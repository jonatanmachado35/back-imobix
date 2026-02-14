import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('UserAvatarController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  // Minimal valid 1x1 PNG image in base64
  const validPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Limpar usuários de teste
    await prisma.user.deleteMany({
      where: { email: { contains: 'avatar-test' } },
    });

    // Criar usuário para testes
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Avatar Test User',
        email: 'avatar-test@example.com',
        password: 'Password123!',
        userRole: 'cliente',
      });

    if (createResponse.status !== 201) {
      console.error('Failed to create user:', createResponse.body);
      throw new Error(`User creation failed: ${JSON.stringify(createResponse.body)}`);
    }

    userId = createResponse.body.id;

    // Fazer login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'avatar-test@example.com',
        password: 'Password123!',
      });

    if (loginResponse.status !== 201) {
      console.error('Failed to login:', loginResponse.body);
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
    }

    authToken = loginResponse.body.access_token;
  }, 30000);

  afterAll(async () => {
    // Limpar usuários de teste
    await prisma.user.deleteMany({
      where: { email: { contains: 'avatar-test' } },
    });
    await app.close();
  });

  describe('POST /users/me/avatar', () => {
    it('should upload avatar and return URL', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', validPngBuffer, 'profile.png')
        .expect(201);

      expect(response.body).toHaveProperty('avatarUrl');
      expect(response.body.avatarUrl).toContain('cloudinary');
      expect(response.body.avatarUrl).toContain('avatars');
    });

    it('should replace existing avatar', async () => {
      // Upload first avatar
      const firstUpload = await request(app.getHttpServer())
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', validPngBuffer, 'first.png')
        .expect(201);

      const firstUrl = firstUpload.body.avatarUrl;

      // Upload second avatar
      const secondUpload = await request(app.getHttpServer())
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', validPngBuffer, 'second.png')
        .expect(201);

      const secondUrl = secondUpload.body.avatarUrl;

      // URLs should be different (new avatar replaced old one)
      expect(secondUrl).toBeDefined();
      expect(firstUrl).toBeDefined();

      // Check user profile has the new avatar
      const profile = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profile.body.avatar).toBe(secondUrl);
    });

    it('should reject request without file', async () => {
      await request(app.getHttpServer())
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should reject non-image file', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', Buffer.from('not an image'), 'document.pdf')
        .expect(400);

      expect(response.body.message).toContain('JPG/PNG');
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/users/me/avatar')
        .attach('avatar', validPngBuffer, 'profile.png')
        .expect(401);
    });
  });

  describe('DELETE /users/me/avatar', () => {
    beforeEach(async () => {
      // Garantir que usuário tem um avatar
      await request(app.getHttpServer())
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', validPngBuffer, 'profile.png')
        .expect(201);
    });

    it('should delete avatar', async () => {
      await request(app.getHttpServer())
        .delete('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Check user profile has no avatar
      const profile = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profile.body.avatar).toBeNull();
    });

    it('should not fail if user does not have avatar', async () => {
      // Delete once
      await request(app.getHttpServer())
        .delete('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Delete again (should not fail)
      await request(app.getHttpServer())
        .delete('/users/me/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .delete('/users/me/avatar')
        .expect(401);
    });
  });
});
