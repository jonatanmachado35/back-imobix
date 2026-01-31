import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Anuncio Images E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let anuncioId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Criar usuário de teste diretamente no banco
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    const testUser = await prisma.user.create({
      data: {
        nome: 'Test User',
        email: `test-${Date.now()}@test.com`,
        passwordHash: hashedPassword,
        role: 'USER',
      },
    });

    // Fazer login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'Test@123' });

    authToken = loginResponse.body.access_token;

    // Criar anúncio de teste
    const anuncio = await prisma.anuncio.create({
      data: {
        titulo: 'Test Anuncio',
        descricao: 'Test Description',
        tipo: 'VENDA',
        endereco: 'Rua Test, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        valor: 500000,
      },
    });

    anuncioId = anuncio.id;
  }, 30000);

  afterAll(async () => {
    // Limpar dados de teste
    if (anuncioId) {
      await prisma.anuncioImage.deleteMany({ where: { anuncioId } });
      await prisma.anuncio.delete({ where: { id: anuncioId } });
    }
    await app.close();
  });

  describe('POST /anuncios/:id/images', () => {
    it('should reject upload without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post(`/anuncios/${anuncioId}/images`)
        .attach('file', Buffer.from('fake-image'), 'test.jpg');

      expect(response.status).toBe(401);
    });

    it('should reject upload for invalid file (no real file provided)', async () => {
      // When sending a fake buffer without proper mime type, 
      // ParseFilePipe validation fails with 400 before reaching use case
      const nonExistentId = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d';
      const response = await request(app.getHttpServer())
        .post(`/anuncios/${nonExistentId}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-image'), 'test.jpg');

      // Expect 400 because file validation happens before anuncio existence check
      expect(response.status).toBe(400);
    });

    // Note: Full upload test would require mocking Cloudinary or using test credentials
    // For now, we test validation and authentication
  });

  describe('GET /anuncios/:id/images', () => {
    it('should list images for anuncio', async () => {
      const response = await request(app.getHttpServer())
        .get(`/anuncios/${anuncioId}/images`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject without authentication', async () => {
      const response = await request(app.getHttpServer()).get(
        `/anuncios/${anuncioId}/images`,
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent anuncio', async () => {
      const nonExistentId = 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d'; // Valid UUID that doesn't exist
      const response = await request(app.getHttpServer())
        .get(`/anuncios/${nonExistentId}/images`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
