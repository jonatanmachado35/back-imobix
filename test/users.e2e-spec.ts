import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    // Cleanup only specific test emails
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: 'ana@example.com' },
            { email: 'ana-duplicate@example.com' },
            { email: 'update-phone@example.com' },
          ]
        }
      }).catch(() => { });
    }
  }, 30000);

  afterAll(async () => {
    // Cleanup test data
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: 'ana@example.com' },
            { email: 'ana-duplicate@example.com' },
            { email: 'update-phone@example.com' },
          ]
        }
      }).catch(() => { });
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /users creates a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Ana',
        email: 'ana@example.com',
        password: 'password123',
        userRole: 'cliente'
      })
      .expect(201);

    expect(response.body).toMatchObject({
      nome: 'Ana',
      email: 'ana@example.com'
    });
    expect(response.body.id).toBeDefined();
  });

  it('POST /users rejects duplicate email', async () => {
    // First create a user
    await request(app.getHttpServer()).post('/users').send({
      nome: 'Ana',
      email: 'ana-duplicate@example.com',
      password: 'password123',
      userRole: 'cliente'
    }).expect(201);

    // Wait for database to commit
    await new Promise(resolve => setTimeout(resolve, 200));

    // Try to create another user with same email
    await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Ana 2',
        email: 'ana-duplicate@example.com',
        password: 'password123',
        userRole: 'cliente'
      })
      .expect(409);
  });

  it('PATCH /users/me updates phone and avatar fields', async () => {
    // 1. Create a user
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Test User',
        email: 'update-phone@example.com',
        password: 'password123',
        userRole: 'cliente'
      })
      .expect(201);

    // 2. Login to get JWT token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'update-phone@example.com',
        password: 'password123'
      })
      .expect(201);

    const accessToken = loginResponse.body.access_token;
    expect(accessToken).toBeDefined();

    // 3. Update profile with phone and avatar
    const updateResponse = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Name',
        email: 'update-phone@example.com',
        phone: '51988888888',
        avatar: 'https://example.com/avatar.jpg'
      })
      .expect(200);

    // 4. Assert that phone and avatar are updated
    expect(updateResponse.body.name).toBe('Updated Name');
    expect(updateResponse.body.phone).toBe('51988888888');
    expect(updateResponse.body.avatar).toBe('https://example.com/avatar.jpg');
    expect(updateResponse.body.email).toBe('update-phone@example.com');

    // 5. Verify by getting profile again
    const profileResponse = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileResponse.body.phone).toBe('51988888888');
    expect(profileResponse.body.avatar).toBe('https://example.com/avatar.jpg');
  });
});
