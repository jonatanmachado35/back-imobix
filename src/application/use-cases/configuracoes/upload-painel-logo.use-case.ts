import { IFileStorageService, FileUploadDto } from '../../ports/file-storage.interface';
import { TenantBrandingRepository } from '../../ports/tenant-branding-repository';

export interface UploadLogoInput {
  /** tenantId extraído do JWT — não aceito como parâmetro do cliente (ADR-001) */
  tenantId: string;
  file: FileUploadDto;
}

export interface UploadLogoOutput {
  logoUrl: string;
}

export class UploadPainelLogoUseCase {
  constructor(
    private readonly brandingRepository: TenantBrandingRepository,
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(input: UploadLogoInput): Promise<UploadLogoOutput> {
    // Validação específica para logos (2MB, JPEG/PNG/SVG)
    this.validateLogoFile(input.file);

    // Upload via Cloudinary (decisão de storage — reutiliza a infra já existente)
    const result = await this.fileStorageService.upload(input.file, 'tenant-logos');

    // Persiste logoUrl no branding do tenant
    await this.brandingRepository.upsert(input.tenantId, {
      logoUrl: result.secureUrl,
    });

    return { logoUrl: result.secureUrl };
  }

  private validateLogoFile(file: FileUploadDto): void {
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];

    if (file.size > MAX_SIZE) {
      throw new Error(`Logo deve ter no máximo 2MB.`);
    }

    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new Error(`Formato inválido. Use JPEG, PNG ou SVG.`);
    }
  }
}
