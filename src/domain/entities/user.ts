import { TEMA_DEFAULT_JSON } from '../constants/tema-default';

export class User {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly phone?: string | null,
    public readonly avatar?: string | null,
    public readonly userRole?: string | null,
    public readonly refreshToken?: string | null,
    public readonly resetPasswordToken?: string | null,
    public readonly resetPasswordExpiry?: Date | null,
    public readonly status: string = 'ACTIVE',
    public readonly primeiroAcesso: boolean = false,
    public readonly tenantId?: string | null,
    public readonly tenantStatus?: string | null,
    /** Tema da interface: JSON com tokens CSS ou 'light'/'dark'/'system' */
    public readonly tema: string = TEMA_DEFAULT_JSON,
  ) { }

  get isBlocked(): boolean {
    return this.status === 'BLOCKED';
  }

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  get isSuperAdmin(): boolean {
    return this.role === 'SUPER_ADMIN';
  }

  /** Retorna true se o tenant deste usuário estiver suspenso */
  get isTenantSuspenso(): boolean {
    return this.tenantStatus === 'SUSPENSO';
  }

  updateProfile(data: {
    nome?: string;
    email?: string;
    phone?: string;
    avatar?: string | null;
    primeiroAcesso?: boolean;
    tema?: string;
  }): User {
    return new User(
      this.id,
      data.nome ?? this.nome,
      data.email ?? this.email,
      this.passwordHash,
      this.role,
      this.createdAt,
      new Date(),
      data.phone ?? this.phone,
      data.avatar ?? this.avatar,
      this.userRole,
      this.refreshToken,
      this.resetPasswordToken,
      this.resetPasswordExpiry,
      this.status,
      data.primeiroAcesso ?? this.primeiroAcesso,
      this.tenantId,
      this.tenantStatus,
      data.tema ?? this.tema,
    );
  }

  changePassword(newPasswordHash: string): User {
    return new User(
      this.id,
      this.nome,
      this.email,
      newPasswordHash,
      this.role,
      this.createdAt,
      new Date(),
      this.phone,
      this.avatar,
      this.userRole,
      this.refreshToken,
      this.resetPasswordToken,
      this.resetPasswordExpiry,
      this.status,
      this.primeiroAcesso,
      this.tenantId,
      this.tenantStatus,
      this.tema,
    );
  }

  setResetToken(token: string, expiryDate: Date): User {
    return new User(
      this.id,
      this.nome,
      this.email,
      this.passwordHash,
      this.role,
      this.createdAt,
      new Date(),
      this.phone,
      this.avatar,
      this.userRole,
      this.refreshToken,
      token,
      expiryDate,
      this.status,
      this.primeiroAcesso,
      this.tenantId,
      this.tenantStatus,
      this.tema,
    );
  }

  clearResetToken(): User {
    return new User(
      this.id,
      this.nome,
      this.email,
      this.passwordHash,
      this.role,
      this.createdAt,
      new Date(),
      this.phone,
      this.avatar,
      this.userRole,
      this.refreshToken,
      null,
      null,
      this.status,
      this.primeiroAcesso,
      this.tenantId,
      this.tenantStatus,
      this.tema,
    );
  }

  isResetTokenValid(token: string): boolean {
    if (!this.resetPasswordToken || !this.resetPasswordExpiry) {
      return false;
    }

    if (this.resetPasswordToken !== token) {
      return false;
    }

    return new Date() < this.resetPasswordExpiry;
  }

  block(): User {
    return new User(
      this.id,
      this.nome,
      this.email,
      this.passwordHash,
      this.role,
      this.createdAt,
      new Date(),
      this.phone,
      this.avatar,
      this.userRole,
      this.refreshToken,
      this.resetPasswordToken,
      this.resetPasswordExpiry,
      'BLOCKED',
      this.primeiroAcesso,
      this.tenantId,
      this.tenantStatus,
      this.tema,
    );
  }

  unblock(): User {
    return new User(
      this.id,
      this.nome,
      this.email,
      this.passwordHash,
      this.role,
      this.createdAt,
      new Date(),
      this.phone,
      this.avatar,
      this.userRole,
      this.refreshToken,
      this.resetPasswordToken,
      this.resetPasswordExpiry,
      'ACTIVE',
      this.primeiroAcesso,
      this.tenantId,
      this.tenantStatus,
      this.tema,
    );
  }

  promoteToAdmin(): User {
    return new User(
      this.id,
      this.nome,
      this.email,
      this.passwordHash,
      'ADMIN',
      this.createdAt,
      new Date(),
      this.phone,
      this.avatar,
      this.userRole,
      this.refreshToken,
      this.resetPasswordToken,
      this.resetPasswordExpiry,
      this.status,
      this.primeiroAcesso,
      this.tenantId,
      this.tenantStatus,
      this.tema,
    );
  }
}
