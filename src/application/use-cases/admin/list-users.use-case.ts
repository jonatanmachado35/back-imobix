import { ListUsersFilters, ListUsersResult, UserRepository } from '../../ports/user-repository';

export class ListUsersUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) { }

  async execute(filters: ListUsersFilters): Promise<ListUsersResult> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;

    return this.userRepository.findAll({
      page,
      limit,
      role: filters.role,
      status: filters.status,
      search: filters.search,
    });
  }
}
