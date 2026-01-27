import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const maxRetries = 3;
    let currentRetry = 0;

    while (currentRetry < maxRetries) {
      try {
        await this.$connect();
        this.logger.log('Database connected successfully');
        return;
      } catch (error) {
        currentRetry++;
        this.logger.error(
          `Failed to connect to database (attempt ${currentRetry}/${maxRetries})`,
          error
        );

        if (currentRetry >= maxRetries) {
          this.logger.error('Max retries reached. Could not connect to database.');
          throw error;
        }

        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
