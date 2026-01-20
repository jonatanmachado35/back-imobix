import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
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
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users creates a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'password123'
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Ana',
      email: 'ana@example.com'
    });
    expect(response.body.id).toBeDefined();
  });

  it('POST /users rejects duplicate email', async () => {
    await request(app.getHttpServer()).post('/users').send({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'password123'
    });

    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Ana 2',
        email: 'ana@example.com',
        password: 'password123'
      })
      .expect(409);
  });
});
