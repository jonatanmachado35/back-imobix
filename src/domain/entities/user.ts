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
    public readonly refreshToken?: string | null
  ) { }

  updateProfile(data: { nome?: string; email?: string; phone?: string; avatar?: string }): User {
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
      this.refreshToken
    );
  }
}
