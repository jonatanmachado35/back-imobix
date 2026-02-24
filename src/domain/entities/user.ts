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
  ) { }

  get isBlocked(): boolean {
    return this.status === 'BLOCKED';
  }

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  updateProfile(data: { nome?: string; email?: string; phone?: string; avatar?: string | null }): User {
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
    );
  }
}
