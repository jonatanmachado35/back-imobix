import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    const maxRetries = 5;
    let currentRetry = 0;

    while (currentRetry < maxRetries) {
      try {
        this.logger.log(`Attempting database connection (${currentRetry + 1}/${maxRetries})...`);
        await this.$connect();
        this.logger.log('✅ Database connected successfully');
        return;
      } catch (error) {
        currentRetry++;
        this.logger.error(
          `❌ Failed to connect to database (attempt ${currentRetry}/${maxRetries})`,
          error.message
        );

        if (currentRetry >= maxRetries) {
          this.logger.error('⚠️  Max retries reached. Database connection failed.');
          this.logger.error('Please check:');
          this.logger.error('1. Supabase project is not paused (check dashboard)');
          this.logger.error('2. DATABASE_URL includes ?pgbouncer=true');
          this.logger.error('3. Credentials are correct');
          this.logger.error(`Current DATABASE_URL format: ${this.maskUrl(process.env.DATABASE_URL)}`);
          throw error;
        }

        // Exponential backoff: 2s, 4s, 8s, 16s
        const waitTime = Math.min(2000 * Math.pow(2, currentRetry - 1), 16000);
        this.logger.log(`Waiting ${waitTime / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private maskUrl(url?: string): string {
    if (!url) return 'NOT_SET';
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.username}:****@${urlObj.host}${urlObj.pathname}${urlObj.search}`;
    } catch {
      return 'INVALID_URL';
    }
  }
}
