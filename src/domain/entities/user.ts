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
  ) { }

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
    );
  }

  // 🆕 Método para trocar senha
  changePassword(newPasswordHash: string): User {
    return new User(
      this.id,
      this.nome,
      this.email,
      newPasswordHash,
      this.role,
      this.createdAt,
      new Date(), // updatedAt
      this.phone,
      this.avatar,
      this.userRole,
      this.refreshToken,
      this.resetPasswordToken,
      this.resetPasswordExpiry,
    );
  }

  // 🆕 Método para definir token de reset
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
    );
  }

  // 🆕 Método para limpar token de reset
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
    );
  }

  // 🆕 Validação do token de reset
  isResetTokenValid(token: string): boolean {
    if (!this.resetPasswordToken || !this.resetPasswordExpiry) {
      return false;
    }

    if (this.resetPasswordToken !== token) {
      return false;
    }

    // Verifica se token não expirou
    return new Date() < this.resetPasswordExpiry;
  }
}
