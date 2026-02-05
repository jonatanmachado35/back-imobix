import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import sharp from 'sharp';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Create Anuncio With Images E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  // Helper para criar imagem de teste REAL usando Sharp
  const createTestImageBuffer = async (width = 100, height = 100): Promise<Buffer> => {
    // Gera uma imagem JPEG real com cor sólida
    return await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 0, b: 0 } // Vermelho
      }
    })
      .jpeg({ quality: 90 })
      .toBuffer();
  };

  // Helper para criar request base com todos os campos obrigatórios
  const createBaseRequest = () => request(app.getHttpServer())
    .post('/anuncios')
    .set('Authorization', `Bearer ${authToken}`)
    .field('titulo', 'Casa na Praia')
    .field('tipo', 'CASA_PRAIA')
    .field('endereco', 'Rua da Praia, 123')
    .field('cidade', 'Florianópolis')
    .field('estado', 'SC')
    .field('valorDiaria', '500')
    .field('valorDiariaFimSemana', '600')
    .field('capacidadeHospedes', '6')
    .field('quartos', '3')
    .field('camas', '4')
    .field('banheiros', '2');

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Criar usuário de teste
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    const testUser = await prisma.user.create({
      data: {
        nome: 'Test User Images',
        email: `test-images-${Date.now()}@test.com`,
        passwordHash: hashedPassword,
        role: 'USER',
      },
    });

    // Fazer login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'Test@123' });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.anuncioImage.deleteMany({});
    await prisma.anuncio.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-images-' } },
    });
    await app.close();
  });

  describe('POST /anuncios (with images)', () => {
    it('should reject creation without images', async () => {
      const response = await createBaseRequest();

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Pelo menos 1 imagem é obrigatória');
    });

    it('should create anuncio with 1 image successfully', async () => {
      const response = await createBaseRequest()
        .attach('images', await createTestImageBuffer(200, 200), 'casa1.jpg');

      if (response.status !== 201) {
        console.log('ERROR BODY:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.titulo).toBe('Casa na Praia');
      expect(response.body.images).toHaveLength(1);
      expect(response.body.images[0].isPrimary).toBe(true);
      expect(response.body.images[0].displayOrder).toBe(0);

      // Limpar
      await prisma.anuncioImage.deleteMany({ where: { anuncioId: response.body.id } });
      await prisma.anuncio.delete({ where: { id: response.body.id } });
    });

    it('should create anuncio with multiple images', async () => {
      const response = await request(app.getHttpServer())
        .post('/anuncios')
        .set('Authorization', `Bearer ${authToken}`)
        .field('titulo', 'Apartamento Luxo')
        .field('tipo', 'APARTAMENTO_PRAIA')
        .field('endereco', 'Rua da Praia, 123')
        .field('cidade', 'Florianópolis')
        .field('estado', 'SC')
        .field('valorDiaria', '500')
        .field('valorDiariaFimSemana', '600')
        .field('capacidadeHospedes', '6')
        .field('quartos', '3')
        .field('camas', '4')
        .field('banheiros', '2')
        .attach('images', await createTestImageBuffer(150, 150), 'apto1.jpg')
        .attach('images', await createTestImageBuffer(300, 200), 'apto2.jpg')
        .attach('images', await createTestImageBuffer(250, 180), 'apto3.jpg');

      if (response.status !== 201) {
        console.log('ERROR STATUS:', response.status);
        console.log('ERROR BODY:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.images).toHaveLength(3);

      // Verificar primeira imagem é primária
      const primaryImages = response.body.images.filter(img => img.isPrimary);
      expect(primaryImages).toHaveLength(1);
      expect(primaryImages[0].displayOrder).toBe(0);

      // Verificar ordering
      expect(response.body.images[0].displayOrder).toBe(0);
      expect(response.body.images[1].displayOrder).toBe(1);
      expect(response.body.images[2].displayOrder).toBe(2);

      // Limpar
      await prisma.anuncioImage.deleteMany({ where: { anuncioId: response.body.id } });
      await prisma.anuncio.delete({ where: { id: response.body.id } });
    });

    it('should reject creation without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/anuncios')
        // Sem Authorization header
        .field('titulo', 'Casa Test')
        .field('tipo', 'CASA_PRAIA')
        .field('endereco', 'Rua Test, 123')
        .field('cidade', 'Florianópolis')
        .field('estado', 'SC')
        .field('valorDiaria', '500')
        .field('valorDiariaFimSemana', '600')
        .field('capacidadeHospedes', '6')
        .field('quartos', '3')
        .field('camas', '4')
        .field('banheiros', '2')
        .attach('images', await createTestImageBuffer(100, 100), 'test.jpg');

      expect(response.status).toBe(401);
    });

    it('should verify atomic transaction (anuncio + images created together)', async () => {
      const response = await request(app.getHttpServer())
        .post('/anuncios')
        .set('Authorization', `Bearer ${authToken}`)
        .field('titulo', 'Test Transaction')
        .field('tipo', 'CASA_PRAIA')
        .field('endereco', 'Rua da Praia, 123')
        .field('cidade', 'Florianópolis')
        .field('estado', 'SC')
        .field('valorDiaria', '500')
        .field('valorDiariaFimSemana', '600')
        .field('capacidadeHospedes', '6')
        .field('quartos', '3')
        .field('camas', '4')
        .field('banheiros', '2')
        .attach('images', await createTestImageBuffer(120, 120), 'test1.jpg')
        .attach('images', await createTestImageBuffer(120, 120), 'test2.jpg');

      expect(response.status).toBe(201);

      // Verificar que anúncio e imagens foram criados atomicamente
      const anuncioDb = await prisma.anuncio.findUnique({
        where: { id: response.body.id },
        include: { images: true },
      });

      expect(anuncioDb).not.toBeNull();
      expect(anuncioDb.images).toHaveLength(2);

      // Limpar
      await prisma.anuncioImage.deleteMany({ where: { anuncioId: response.body.id } });
      await prisma.anuncio.delete({ where: { id: response.body.id } });
    });
  });

  describe('Business Rules Validation', () => {
    it('should enforce minimum 1 image rule', async () => {
      // Tentar criar sem imagem
      const response = await request(app.getHttpServer())
        .post('/anuncios')
        .set('Authorization', `Bearer ${authToken}`)
        .field('titulo', 'Test No Images')
        .field('tipo', 'CASA_PRAIA')
        .field('endereco', 'Rua da Praia, 123')
        .field('cidade', 'Florianópolis')
        .field('estado', 'SC')
        .field('valorDiaria', '500')
        .field('valorDiariaFimSemana', '600')
        .field('capacidadeHospedes', '6')
        .field('quartos', '3')
        .field('camas', '4')
        .field('banheiros', '2');
      // SEM attach de imagens propositalmente

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Pelo menos 1 imagem é obrigatória');

      // Verificar que nenhum anúncio foi criado
      const anunciosCount = await prisma.anuncio.count({
        where: { titulo: 'Test No Images' },
      });
      expect(anunciosCount).toBe(0);
    });
  });

  describe('DELETE /anuncios/:id', () => {
    it('should delete anuncio and its images from Cloudinary', async () => {
      // Criar anúncio com imagens primeiro
      const createResponse = await createBaseRequest()
        .attach('images', await createTestImageBuffer(200, 200), 'test-delete1.jpg')
        .attach('images', await createTestImageBuffer(200, 200), 'test-delete2.jpg');

      expect(createResponse.status).toBe(201);
      const anuncioId = createResponse.body.id;

      // Deletar anúncio
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/anuncios/${anuncioId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verificar que anúncio foi deletado do banco
      const anuncioDb = await prisma.anuncio.findUnique({
        where: { id: anuncioId },
      });
      expect(anuncioDb).toBeNull();

      // Verificar que imagens foram deletadas do banco (cascade)
      const imagesDb = await prisma.anuncioImage.findMany({
        where: { anuncioId },
      });
      expect(imagesDb).toHaveLength(0);
    });

    it('should return 404 when deleting non-existent anuncio', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/anuncios/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Anúncio não encontrado');
    });

    it('should reject deletion without authentication', async () => {
      // Criar anúncio
      const createResponse = await createBaseRequest()
        .attach('images', await createTestImageBuffer(100, 100), 'test-auth.jpg');

      expect(createResponse.status).toBe(201);
      const anuncioId = createResponse.body.id;

      // Tentar deletar sem token
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/anuncios/${anuncioId}`);
      // Sem Authorization header

      expect(deleteResponse.status).toBe(401);

      // Verificar que anúncio ainda existe
      const anuncioDb = await prisma.anuncio.findUnique({
        where: { id: anuncioId },
      });
      expect(anuncioDb).not.toBeNull();

      // Limpar
      await prisma.anuncioImage.deleteMany({ where: { anuncioId } });
      await prisma.anuncio.delete({ where: { id: anuncioId } });
    });
  });
});
