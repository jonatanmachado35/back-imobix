import {
  ListTenantsFilters,
  ListTenantsResult,
  TenantRepository,
} from '../../ports/tenant-repository';

export type ListTenantsInput = ListTenantsFilters;
export type ListTenantsOutput = ListTenantsResult;

export class ListTenantsUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(input: ListTenantsInput): Promise<ListTenantsOutput> {
    return this.tenantRepository.findAll(input);
  }
}
