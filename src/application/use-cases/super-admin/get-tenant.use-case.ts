import {
  TenantDetailData,
  TenantRepository,
} from '../../ports/tenant-repository';
import { TenantNotFoundError } from './super-admin-errors';

export type GetTenantInput = { id: string };
export type GetTenantOutput = TenantDetailData;

export class GetTenantUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(input: GetTenantInput): Promise<GetTenantOutput> {
    const tenant = await this.tenantRepository.findById(input.id);

    if (!tenant) {
      throw new TenantNotFoundError();
    }

    return tenant;
  }
}
