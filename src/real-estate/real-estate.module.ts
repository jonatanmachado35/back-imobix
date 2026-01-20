import { Module } from '@nestjs/common';
import { RealEstateService } from './real-estate.service';
import { AnunciosController } from './anuncios.controller';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AnunciosController],
  providers: [RealEstateService],
})
export class RealEstateModule { }
