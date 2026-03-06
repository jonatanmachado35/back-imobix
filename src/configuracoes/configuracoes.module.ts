import { Module } from '@nestjs/common';
import { ConfiguracoesController } from './configuracoes.controller';
import { GetPainelBrandingUseCase } from '../application/use-cases/configuracoes/get-painel-branding.use-case';
import { UpdatePainelBrandingUseCase } from '../application/use-cases/configuracoes/update-painel-branding.use-case';
import { UploadPainelLogoUseCase } from '../application/use-cases/configuracoes/upload-painel-logo.use-case';
import { TenantBrandingRepository } from '../application/ports/tenant-branding-repository';
import { IFileStorageService } from '../application/ports/file-storage.interface';
import { PrismaTenantBrandingRepository } from '../infrastructure/database/prisma-tenant-branding.repository';
import { CloudinaryModule } from '../infrastructure/file-storage/cloudinary/cloudinary.module';

export const TENANT_BRANDING_REPOSITORY = 'TENANT_BRANDING_REPOSITORY';

@Module({
  imports: [CloudinaryModule],
  controllers: [ConfiguracoesController],
  providers: [
    {
      provide: TENANT_BRANDING_REPOSITORY,
      useClass: PrismaTenantBrandingRepository,
    },
    {
      provide: GetPainelBrandingUseCase,
      useFactory: (repo: TenantBrandingRepository) =>
        new GetPainelBrandingUseCase(repo),
      inject: [TENANT_BRANDING_REPOSITORY],
    },
    {
      provide: UpdatePainelBrandingUseCase,
      useFactory: (repo: TenantBrandingRepository) =>
        new UpdatePainelBrandingUseCase(repo),
      inject: [TENANT_BRANDING_REPOSITORY],
    },
    {
      provide: UploadPainelLogoUseCase,
      useFactory: (repo: TenantBrandingRepository, storage: IFileStorageService) =>
        new UploadPainelLogoUseCase(repo, storage),
      inject: [TENANT_BRANDING_REPOSITORY, IFileStorageService],
    },
  ],
})
export class ConfiguracoesModule {}
