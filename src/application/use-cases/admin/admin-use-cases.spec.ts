import { User } from '../../../domain/entities/user';
import { AdminActionType } from '../../../domain/entities/admin-audit-log';
import { CreateAuditLogData } from '../../ports/admin-audit-log-repository';
import { CreateUserData, ListUsersFilters, ListUsersResult, SaveWithAuditLogOptions, UpdateUserData, UserRepository } from '../../ports/user-repository';
import { UserNotFoundError } from '../user-errors';
import {
  CannotBlockAdminError,
  CannotPromoteBlockedUserError,
  UserAlreadyAdminError,
  UserAlreadyBlockedError,
  UserNotBlockedError,
} from './admin-errors';
import { BlockUserUseCase } from './block-user.use-case';
import { ListUsersUseCase } from './list-users.use-case';
import { PromoteToAdminUseCase } from './promote-to-admin.use-case';
import { UnblockUserUseCase } from './unblock-user.use-case';

// --- Test doubles ---

class InMemoryUserRepository implements UserRepository {
  public items: User[] = [];
  private counter = 1;
  public auditLogs: CreateAuditLogData[] = [];
  public refreshTokenUpdates: { id: string; token: string | null }[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((item) => item.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    const now = new Date();
    const user = new User(
      `user-${this.counter++}`,
      data.nome,
      data.email,
      data.passwordHash,
      data.role || 'USER',
      now,
      now,
      null,
      null,
      data.userRole || 'cliente',
      null,
      null,
      null,
      'ACTIVE',
    );
    this.items.push(user);
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');
    return user.updateProfile(data);
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    this.refreshTokenUpdates.push({ id, token });
  }

  async save(user: User): Promise<void> {
    const index = this.items.findIndex((item) => item.id === user.id);
    if (index >= 0) {
      this.items[index] = user;
    } else {
      this.items.push(user);
    }
  }

  async saveWithAuditLog(
    user: User,
    auditLogData: CreateAuditLogData,
    options?: SaveWithAuditLogOptions,
  ): Promise<void> {
    // Simulates transactional behavior: save user + audit log atomically
    await this.save(user);
    if (options?.invalidateRefreshToken) {
      this.refreshTokenUpdates.push({ id: user.id, token: null });
    }
    this.auditLogs.push(auditLogData);
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.items.find((item) => item.resetPasswordToken === token) ?? null;
  }

  async findAll(filters: ListUsersFilters): Promise<ListUsersResult> {
    let filtered = [...this.items];
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    if (filters.role) {
      filtered = filtered.filter((u) => u.role === filters.role);
    }
    if (filters.status) {
      const statusMap: Record<string, string> = { active: 'ACTIVE', blocked: 'BLOCKED' };
      filtered = filtered.filter((u) => u.status === (statusMap[filters.status!] || filters.status));
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (u) => u.nome.toLowerCase().includes(search) || u.email.toLowerCase().includes(search),
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  addUser(user: User): void {
    this.items.push(user);
  }
}

// --- Helper ---

function makeUser(overrides: Partial<{
  id: string; nome: string; email: string; role: string; status: string;
}> = {}): User {
  return new User(
    overrides.id || 'user-1',
    overrides.nome || 'Test User',
    overrides.email || 'test@example.com',
    'hashed-pass',
    overrides.role || 'USER',
    new Date(),
    new Date(),
    null,
    null,
    'cliente',
    null,
    null,
    null,
    overrides.status || 'ACTIVE',
  );
}

function makeAdmin(overrides: Partial<{ id: string; nome: string; email: string }> = {}): User {
  return new User(
    overrides.id || 'admin-1',
    overrides.nome || 'Admin User',
    overrides.email || 'admin@example.com',
    'hashed-pass',
    'ADMIN',
    new Date(),
    new Date(),
    null,
    null,
    'cliente',
    null,
    null,
    null,
    'ACTIVE',
  );
}

// ==========================================
// PromoteToAdminUseCase
// ==========================================

describe('PromoteToAdminUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let useCase: PromoteToAdminUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    useCase = new PromoteToAdminUseCase(userRepository);
  });

  it('should promote a USER to ADMIN', async () => {
    const admin = makeAdmin();
    const user = makeUser({ id: 'target-1', email: 'target@example.com' });
    userRepository.addUser(admin);
    userRepository.addUser(user);

    const result = await useCase.execute({
      adminId: admin.id,
      targetUserId: user.id,
    });

    expect(result.role).toBe('ADMIN');
    expect(result.message).toBe('Usuario promovido a admin');

    // Verify user was updated in repository
    const updated = await userRepository.findById(user.id);
    expect(updated!.role).toBe('ADMIN');

    // Verify audit log was created (via saveWithAuditLog)
    expect(userRepository.auditLogs).toHaveLength(1);
    expect(userRepository.auditLogs[0].action).toBe('PROMOTE_TO_ADMIN');
    expect(userRepository.auditLogs[0].adminId).toBe(admin.id);
    expect(userRepository.auditLogs[0].targetUserId).toBe(user.id);
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    await expect(
      useCase.execute({ adminId: 'admin-1', targetUserId: 'nonexistent' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('should throw UserAlreadyAdminError when user is already ADMIN', async () => {
    const existingAdmin = makeAdmin({ id: 'existing-admin' });
    userRepository.addUser(existingAdmin);

    await expect(
      useCase.execute({ adminId: 'admin-1', targetUserId: existingAdmin.id }),
    ).rejects.toBeInstanceOf(UserAlreadyAdminError);
  });

  it('should throw CannotPromoteBlockedUserError when user is blocked', async () => {
    const blockedUser = makeUser({ id: 'blocked-1', status: 'BLOCKED' });
    userRepository.addUser(blockedUser);

    await expect(
      useCase.execute({ adminId: 'admin-1', targetUserId: blockedUser.id }),
    ).rejects.toBeInstanceOf(CannotPromoteBlockedUserError);
  });

  it('should not create audit log when promotion fails', async () => {
    await expect(
      useCase.execute({ adminId: 'admin-1', targetUserId: 'nonexistent' }),
    ).rejects.toThrow();

    expect(userRepository.auditLogs).toHaveLength(0);
  });
});

// ==========================================
// BlockUserUseCase
// ==========================================

describe('BlockUserUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let useCase: BlockUserUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    useCase = new BlockUserUseCase(userRepository);
  });

  it('should block a USER', async () => {
    const user = makeUser({ id: 'target-1' });
    userRepository.addUser(user);

    const result = await useCase.execute({
      adminId: 'admin-1',
      targetUserId: user.id,
    });

    expect(result.status).toBe('blocked');
    expect(result.message).toBe('Usuario bloqueado');

    // Verify user was updated
    const updated = await userRepository.findById(user.id);
    expect(updated!.status).toBe('BLOCKED');

    // Verify refresh token was invalidated (RN-02) within the transaction
    expect(userRepository.refreshTokenUpdates).toHaveLength(1);
    expect(userRepository.refreshTokenUpdates[0]).toEqual({
      id: user.id,
      token: null,
    });

    // Verify audit log was created (via saveWithAuditLog)
    expect(userRepository.auditLogs).toHaveLength(1);
    expect(userRepository.auditLogs[0].action).toBe('BLOCK_USER');
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    await expect(
      useCase.execute({ adminId: 'admin-1', targetUserId: 'nonexistent' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('should throw CannotBlockAdminError when target is ADMIN', async () => {
    const admin = makeAdmin({ id: 'target-admin' });
    userRepository.addUser(admin);

    await expect(
      useCase.execute({ adminId: 'admin-1', targetUserId: admin.id }),
    ).rejects.toBeInstanceOf(CannotBlockAdminError);
  });

  it('should throw UserAlreadyBlockedError when user is already blocked', async () => {
    const blocked = makeUser({ id: 'blocked-1', status: 'BLOCKED' });
    userRepository.addUser(blocked);

    await expect(
      useCase.execute({ adminId: 'admin-1', targetUserId: blocked.id }),
    ).rejects.toBeInstanceOf(UserAlreadyBlockedError);
  });

  it('should not invalidate refresh token or create audit log when block fails', async () => {
    const admin = makeAdmin({ id: 'target-admin' });
    userRepository.addUser(admin);

    await expect(
      useCase.execute({ adminId: 'admin-1', targetUserId: admin.id }),
    ).rejects.toThrow();

    expect(userRepository.refreshTokenUpdates).toHaveLength(0);
    expect(userRepository.auditLogs).toHaveLength(0);
  });
});

// ==========================================
// UnblockUserUseCase
// ==========================================

describe('UnblockUserUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let useCase: UnblockUserUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    useCase = new UnblockUserUseCase(userRepository);
  });

  it('should unblock a blocked user', async () => {
    const blocked = makeUser({ id: 'blocked-1', status: 'BLOCKED' });
    userRepository.addUser(blocked);

    const result = await useCase.execute({
      adminId: 'admin-1',
      targetUserId: blocked.id,
    });

    expect(result.status).toBe('active');
    expect(result.message).toBe('Usuario desbloqueado');

    // Verify user was updated
    const updated = await userRepository.findById(blocked.id);
    expect(updated!.status).toBe('ACTIVE');

    // Verify audit log was created (via saveWithAuditLog)
    expect(userRepository.auditLogs).toHaveLength(1);
    expect(userRepository.auditLogs[0].action).toBe('UNBLOCK_USER');
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    await expect(
      useCase.execute({ adminId: 'admin-1', targetUserId: 'nonexistent' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('should throw UserNotBlockedError when user is not blocked', async () => {
    const activeUser = makeUser({ id: 'active-1' });
    userRepository.addUser(activeUser);

    await expect(
      useCase.execute({ adminId: 'admin-1', targetUserId: activeUser.id }),
    ).rejects.toBeInstanceOf(UserNotBlockedError);
  });
});

// ==========================================
// ListUsersUseCase
// ==========================================

describe('ListUsersUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let useCase: ListUsersUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    useCase = new ListUsersUseCase(userRepository);
  });

  it('should list all users with default pagination', async () => {
    userRepository.addUser(makeUser({ id: '1', nome: 'User 1', email: 'user1@test.com' }));
    userRepository.addUser(makeUser({ id: '2', nome: 'User 2', email: 'user2@test.com' }));
    userRepository.addUser(makeAdmin({ id: '3', nome: 'Admin 1', email: 'admin1@test.com' }));

    const result = await useCase.execute({});

    expect(result.data).toHaveLength(3);
    expect(result.meta.total).toBe(3);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
  });

  it('should filter by role', async () => {
    userRepository.addUser(makeUser({ id: '1', email: 'user@test.com' }));
    userRepository.addUser(makeAdmin({ id: '2', email: 'admin@test.com' }));

    const result = await useCase.execute({ role: 'ADMIN' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].role).toBe('ADMIN');
  });

  it('should filter by status', async () => {
    userRepository.addUser(makeUser({ id: '1', email: 'active@test.com', status: 'ACTIVE' }));
    userRepository.addUser(makeUser({ id: '2', email: 'blocked@test.com', status: 'BLOCKED' }));

    const result = await useCase.execute({ status: 'blocked' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe('BLOCKED');
  });

  it('should search by name or email', async () => {
    userRepository.addUser(makeUser({ id: '1', nome: 'Maria Silva', email: 'maria@test.com' }));
    userRepository.addUser(makeUser({ id: '2', nome: 'Joao Santos', email: 'joao@test.com' }));

    const result = await useCase.execute({ search: 'maria' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].nome).toBe('Maria Silva');
  });

  it('should use default values for invalid page/limit', async () => {
    userRepository.addUser(makeUser({ id: '1', email: 'user@test.com' }));

    const result = await useCase.execute({ page: -1, limit: 0 });

    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
  });

  it('should cap limit at 100', async () => {
    const result = await useCase.execute({ limit: 500 });

    expect(result.meta.limit).toBe(100);
  });
});
