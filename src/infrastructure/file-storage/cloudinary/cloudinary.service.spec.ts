import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import { FileUploadDto } from '../../../application/ports/file-storage.interface';

// Mock do módulo cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    url: jest.fn(),
  },
}));

// Mock das variáveis de ambiente
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should upload a file successfully', async () => {
      const mockFile: FileUploadDto = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      };

      const mockUploadResult = {
        public_id: 'anuncios/test123',
        url: 'http://res.cloudinary.com/test.jpg',
        secure_url: 'https://res.cloudinary.com/test.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 1024,
      };

      const cloudinary = require('cloudinary').v2;
      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        callback(null, mockUploadResult);
        return { end: jest.fn() };
      });

      const result = await service.upload(mockFile);

      expect(result).toEqual({
        publicId: 'anuncios/test123',
        url: 'http://res.cloudinary.com/test.jpg',
        secureUrl: 'https://res.cloudinary.com/test.jpg',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 1024,
      });
    });

    it('should throw error for file size exceeding limit', async () => {
      const mockFile: FileUploadDto = {
        buffer: Buffer.alloc(11 * 1024 * 1024), // 11MB
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 11 * 1024 * 1024,
      };

      await expect(service.upload(mockFile)).rejects.toThrow('File size exceeds maximum allowed size');
    });

    it('should throw error for invalid mimetype', async () => {
      const mockFile: FileUploadDto = {
        buffer: Buffer.from('test'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      };

      await expect(service.upload(mockFile)).rejects.toThrow('File type application/pdf is not allowed');
    });

    it('should handle upload failure', async () => {
      const mockFile: FileUploadDto = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      };

      const cloudinary = require('cloudinary').v2;
      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        callback(new Error('Upload failed'), null);
        return { end: jest.fn() };
      });

      await expect(service.upload(mockFile)).rejects.toThrow('Upload failed');
    });
  });

  describe('delete', () => {
    it('should delete a file successfully', async () => {
      const cloudinary = require('cloudinary').v2;
      cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

      await expect(service.delete('test-public-id')).resolves.not.toThrow();
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-public-id');
    });

    it('should handle not found gracefully', async () => {
      const cloudinary = require('cloudinary').v2;
      cloudinary.uploader.destroy.mockResolvedValue({ result: 'not found' });

      await expect(service.delete('non-existent-id')).resolves.not.toThrow();
    });

    it('should throw error on delete failure', async () => {
      const cloudinary = require('cloudinary').v2;
      cloudinary.uploader.destroy.mockRejectedValue(new Error('Delete failed'));

      await expect(service.delete('test-id')).rejects.toThrow('Delete failed');
    });
  });

  describe('getUrl', () => {
    it('should return URL without transformations', () => {
      const cloudinary = require('cloudinary').v2;
      cloudinary.url.mockReturnValue('https://res.cloudinary.com/test.jpg');

      const url = service.getUrl('test-public-id');

      expect(url).toBe('https://res.cloudinary.com/test.jpg');
      expect(cloudinary.url).toHaveBeenCalledWith('test-public-id', { secure: true });
    });

    it('should return URL with transformations', () => {
      const cloudinary = require('cloudinary').v2;
      cloudinary.url.mockReturnValue('https://res.cloudinary.com/test-transformed.jpg');

      const url = service.getUrl('test-public-id', {
        width: 300,
        height: 200,
        crop: 'fill',
        quality: 'auto',
      });

      expect(url).toBe('https://res.cloudinary.com/test-transformed.jpg');
      expect(cloudinary.url).toHaveBeenCalledWith('test-public-id', {
        secure: true,
        width: 300,
        height: 200,
        crop: 'fill',
        quality: 'auto',
      });
    });
  });

  describe('configuration', () => {
    it('should throw error if cloudinary config is missing', () => {
      // Salvar valores originais
      const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const originalApiKey = process.env.CLOUDINARY_API_KEY;
      const originalApiSecret = process.env.CLOUDINARY_API_SECRET;

      // Remover variáveis
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      expect(() => {
        new CloudinaryService();
      }).toThrow('Cloudinary credentials are missing');

      // Restaurar valores originais
      process.env.CLOUDINARY_CLOUD_NAME = originalCloudName;
      process.env.CLOUDINARY_API_KEY = originalApiKey;
      process.env.CLOUDINARY_API_SECRET = originalApiSecret;
    });
  });
});
