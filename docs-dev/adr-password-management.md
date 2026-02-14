# ADR: Password Management Endpoints

**Data**: 2026-02-13  
**Status**: ✅ APROVADO  
**Autor**: Arquiteto do Sistema

---

## 📋 Contexto

Necessidade de implementar funcionalidades de gerenciamento de senha:
1. **Mudar senha (Change Password)**: Usuário autenticado altera sua própria senha
2. **Esqueci a senha (Forgot Password)**: Usuário sem acesso recupera sua senha

**Versão Atual**: Implementação simplificada **sem envio de e-mail** (será adicionado em versão futura)

---

## 🎯 Decisões Arquiteturais

### Princípios Seguidos
- ✅ **Clean Architecture**: Domain → Application → Infrastructure → Interfaces
- ✅ **TDD**: Testes antes da implementação
- ✅ **Imutabilidade**: Domain entities retornam novas instâncias
- ✅ **Nomenclatura**: Português para domínio, inglês para técnico
- ✅ **Security**: Validações de senha, rate limiting, tokens seguros

### Abordagem Simplificada (Sem E-mail)
Para a versão inicial **SEM envio de e-mail**:

**Endpoint 1 (Change Password)**: 
- Requer autenticação JWT
- Valida senha atual
- Atualiza para nova senha

**Endpoint 2 (Forgot Password - Simplificado)**:
- Aceita email + nova senha + token de reset
- Token gerado manualmente por admin (via CLI ou endpoint admin)
- Token armazenado no banco com expiração
- ⚠️ **Limite**: Esta versão é temporária até implementar envio de e-mail

---

## 📦 Estrutura de Diretórios

```
prisma/
└── migrations/
    └── YYYYMMDDHHMMSS_add_password_reset_fields/
        └── migration.sql

src/
├── domain/
│   └── entities/
│       └── user.ts (ATUALIZAR: adicionar changePassword())
│
├── application/
│   ├── ports/
│   │   └── user-repository.ts (ATUALIZAR: novos métodos)
│   │
│   └── use-cases/
│       ├── password/
│       │   ├── change-password.use-case.ts
│       │   ├── change-password.use-case.spec.ts
│       │   ├── request-password-reset.use-case.ts (admin)
│       │   ├── request-password-reset.use-case.spec.ts
│       │   ├── reset-password.use-case.ts
│       │   ├── reset-password.use-case.spec.ts
│       │   └── password-errors.ts
│
├── infrastructure/
│   └── database/
│       └── prisma-user.repository.ts (ATUALIZAR)
│
├── auth/
│   ├── auth.controller.ts (ATUALIZAR: novos endpoints)
│   ├── auth.module.ts (ATUALIZAR: novos providers)
│   └── dto/
│       ├── change-password.dto.ts
│       ├── request-password-reset.dto.ts (admin)
│       └── reset-password.dto.ts
│
└── test/
    └── password-management.e2e-spec.ts
```

---

## 🗄️ Database Schema Changes

### Migration: Add Password Reset Fields

```prisma
// prisma/schema.prisma

model User {
  id                  String   @id @default(cuid())
  nome                String
  email               String   @unique
  passwordHash        String
  role                Role     @default(USER)
  avatar              String?
  phone               String?
  userRole            String?  @default("cliente")
  refreshToken        String?
  
  // 🆕 Campos para reset de senha
  resetPasswordToken  String?  @unique
  resetPasswordExpiry DateTime?
  
  // ... demais campos
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### Migration SQL

```sql
-- migrations/YYYYMMDDHHMMSS_add_password_reset_fields/migration.sql

-- AlterTable
ALTER TABLE "User" 
  ADD COLUMN "resetPasswordToken" TEXT,
  ADD COLUMN "resetPasswordExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");
```

---

## 🏗️ Domain Layer

### 1. Atualizar User Entity

```typescript
// src/domain/entities/user.ts

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
  ) {}

  updateProfile(data: { 
    nome?: string; 
    email?: string; 
    phone?: string; 
    avatar?: string | null;
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
```

### 2. User Entity Tests

```typescript
// src/domain/entities/user.spec.ts (ADICIONAR testes)

describe('User Password Management', () => {
  const baseUser = new User(
    'user-123',
    'John Doe',
    'john@example.com',
    'hashed-password',
    'USER',
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

  describe('changePassword', () => {
    it('should return new instance with updated password hash', () => {
      const newHash = 'new-hashed-password';
      const result = baseUser.changePassword(newHash);

      expect(result).not.toBe(baseUser); // Imutabilidade
      expect(result.passwordHash).toBe(newHash);
      expect(result.id).toBe(baseUser.id);
      expect(result.email).toBe(baseUser.email);
    });

    it('should update the updatedAt timestamp', () => {
      const result = baseUser.changePassword('new-hash');
      expect(result.updatedAt.getTime()).toBeGreaterThan(baseUser.updatedAt.getTime());
    });
  });

  describe('setResetToken', () => {
    it('should return new instance with reset token and expiry', () => {
      const token = 'reset-token-123';
      const expiry = new Date('2024-12-31');
      
      const result = baseUser.setResetToken(token, expiry);

      expect(result).not.toBe(baseUser);
      expect(result.resetPasswordToken).toBe(token);
      expect(result.resetPasswordExpiry).toBe(expiry);
    });
  });

  describe('clearResetToken', () => {
    it('should remove reset token and expiry', () => {
      const userWithToken = baseUser.setResetToken('token', new Date());
      const result = userWithToken.clearResetToken();

      expect(result.resetPasswordToken).toBeNull();
      expect(result.resetPasswordExpiry).toBeNull();
    });
  });

  describe('isResetTokenValid', () => {
    it('should return true for valid non-expired token', () => {
      const token = 'valid-token';
      const futureDate = new Date(Date.now() + 3600000); // +1 hora
      const user = baseUser.setResetToken(token, futureDate);

      expect(user.isResetTokenValid(token)).toBe(true);
    });

    it('should return false for expired token', () => {
      const token = 'expired-token';
      const pastDate = new Date(Date.now() - 3600000); // -1 hora
      const user = baseUser.setResetToken(token, pastDate);

      expect(user.isResetTokenValid(token)).toBe(false);
    });

    it('should return false for wrong token', () => {
      const user = baseUser.setResetToken('correct-token', new Date(Date.now() + 3600000));
      expect(user.isResetTokenValid('wrong-token')).toBe(false);
    });

    it('should return false when no reset token exists', () => {
      expect(baseUser.isResetTokenValid('any-token')).toBe(false);
    });
  });
});
```

---

## 🔧 Application Layer

### 1. Error Classes

```typescript
// src/application/use-cases/password/password-errors.ts

export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super('Senha atual incorreta');
    this.name = 'InvalidCurrentPasswordError';
  }
}

export class WeakPasswordError extends Error {
  constructor(message: string = 'Senha muito fraca') {
    super(message);
    this.name = 'WeakPasswordError';
  }
}

export class PasswordsMatchError extends Error {
  constructor() {
    super('A nova senha deve ser diferente da senha atual');
    this.name = 'PasswordsMatchError';
  }
}

export class InvalidResetTokenError extends Error {
  constructor() {
    super('Token de reset inválido ou expirado');
    this.name = 'InvalidResetTokenError';
  }
}

export class ResetTokenExpiredError extends Error {
  constructor() {
    super('Token de reset expirado. Solicite um novo.');
    this.name = 'ResetTokenExpiredError';
  }
}
```

### 2. Repository Port Updates

```typescript
// src/application/ports/user-repository.ts (ADICIONAR métodos)

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  
  // 🆕 Métodos para reset de senha
  findByResetToken(token: string): Promise<User | null>;
}
```

### 3. Use Case: Change Password

```typescript
// src/application/use-cases/password/change-password.use-case.ts

import { UserRepository } from '../../ports/user-repository';
import { PasswordHasher } from '../../ports/password-hasher';
import { UserNotFoundError } from '../user-errors';
import { 
  InvalidCurrentPasswordError, 
  WeakPasswordError,
  PasswordsMatchError 
} from './password-errors';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    // 1. Buscar usuário
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // 2. Verificar senha atual
    const isCurrentPasswordValid = await this.passwordHasher.compare(
      input.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidCurrentPasswordError();
    }

    // 3. Validar nova senha
    this.validatePassword(input.newPassword);

    // 4. Verificar se nova senha é diferente da atual
    const isSamePassword = await this.passwordHasher.compare(
      input.newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new PasswordsMatchError();
    }

    // 5. Hash da nova senha
    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);

    // 6. Atualizar usuário (imutável)
    const updatedUser = user.changePassword(newPasswordHash);

    // 7. Persistir
    await this.userRepository.save(updatedUser);
  }

  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new WeakPasswordError('Senha deve ter no mínimo 8 caracteres');
    }

    // Regex: pelo menos 1 letra, 1 número
    const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d).+$/.test(password);
    if (!hasLetterAndNumber) {
      throw new WeakPasswordError('Senha deve conter letras e números');
    }
  }
}
```

### 4. Use Case Tests: Change Password

```typescript
// src/application/use-cases/password/change-password.use-case.spec.ts

import { ChangePasswordUseCase } from './change-password.use-case';
import { InMemoryUserRepository } from '../../../infrastructure/database/in-memory-user.repository';
import { User } from '../../../domain/entities/user';
import { 
  InvalidCurrentPasswordError, 
  WeakPasswordError,
  PasswordsMatchError 
} from './password-errors';
import { UserNotFoundError } from '../user-errors';

class MockPasswordHasher {
  private passwords = new Map<string, string>();

  async hash(plain: string): Promise<string> {
    const hashed = `hashed_${plain}`;
    this.passwords.set(hashed, plain);
    return hashed;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed_${plain}`;
  }
}

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let userRepository: InMemoryUserRepository;
  let passwordHasher: MockPasswordHasher;
  let testUser: User;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new MockPasswordHasher();
    useCase = new ChangePasswordUseCase(userRepository, passwordHasher);

    // Setup test user
    const passwordHash = await passwordHasher.hash('OldPassword123');
    testUser = new User(
      'user-123',
      'Test User',
      'test@example.com',
      passwordHash,
      'USER',
      new Date(),
      new Date(),
    );

    await userRepository.save(testUser);
  });

  it('should change password successfully', async () => {
    await useCase.execute({
      userId: 'user-123',
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword456',
    });

    const updatedUser = await userRepository.findById('user-123');
    const isNewPasswordValid = await passwordHasher.compare(
      'NewPassword456',
      updatedUser!.passwordHash,
    );

    expect(isNewPasswordValid).toBe(true);
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    await expect(
      useCase.execute({
        userId: 'invalid-id',
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should throw InvalidCurrentPasswordError when current password is wrong', async () => {
    await expect(
      useCase.execute({
        userId: 'user-123',
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword456',
      }),
    ).rejects.toThrow(InvalidCurrentPasswordError);
  });

  it('should throw WeakPasswordError when new password is too short', async () => {
    await expect(
      useCase.execute({
        userId: 'user-123',
        currentPassword: 'OldPassword123',
        newPassword: 'short',
      }),
    ).rejects.toThrow(WeakPasswordError);
  });

  it('should throw WeakPasswordError when password has no numbers', async () => {
    await expect(
      useCase.execute({
        userId: 'user-123',
        currentPassword: 'OldPassword123',
        newPassword: 'OnlyLetters',
      }),
    ).rejects.toThrow(WeakPasswordError);
  });

  it('should throw PasswordsMatchError when new password is same as current', async () => {
    await expect(
      useCase.execute({
        userId: 'user-123',
        currentPassword: 'OldPassword123',
        newPassword: 'OldPassword123',
      }),
    ).rejects.toThrow(PasswordsMatchError);
  });
});
```

### 5. Use Case: Request Password Reset (Admin)

```typescript
// src/application/use-cases/password/request-password-reset.use-case.ts

import { UserRepository } from '../../ports/user-repository';
import { UserNotFoundError } from '../user-errors';
import * as crypto from 'crypto';

export interface RequestPasswordResetInput {
  email: string;
}

export interface RequestPasswordResetOutput {
  resetToken: string;
  expiresAt: Date;
}

export class RequestPasswordResetUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: RequestPasswordResetInput): Promise<RequestPasswordResetOutput> {
    // 1. Buscar usuário por email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UserNotFoundError();
    }

    // 2. Gerar token seguro (32 bytes = 64 caracteres hex)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 3. Definir expiração (1 hora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // 4. Atualizar usuário com token
    const userWithToken = user.setResetToken(resetToken, expiresAt);
    await this.userRepository.save(userWithToken);

    // 5. Retornar token (na versão com email, seria enviado por email)
    return {
      resetToken,
      expiresAt,
    };
  }
}
```

### 6. Use Case Tests: Request Password Reset

```typescript
// src/application/use-cases/password/request-password-reset.use-case.spec.ts

import { RequestPasswordResetUseCase } from './request-password-reset.use-case';
import { InMemoryUserRepository } from '../../../infrastructure/database/in-memory-user.repository';
import { User } from '../../../domain/entities/user';
import { UserNotFoundError } from '../user-errors';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let userRepository: InMemoryUserRepository;
  let testUser: User;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    useCase = new RequestPasswordResetUseCase(userRepository);

    testUser = new User(
      'user-123',
      'Test User',
      'test@example.com',
      'hashed-password',
      'USER',
      new Date(),
      new Date(),
    );

    await userRepository.save(testUser);
  });

  it('should generate reset token successfully', async () => {
    const result = await useCase.execute({ email: 'test@example.com' });

    expect(result.resetToken).toBeDefined();
    expect(result.resetToken).toHaveLength(64); // 32 bytes hex
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should save reset token in user', async () => {
    const result = await useCase.execute({ email: 'test@example.com' });

    const updatedUser = await userRepository.findById('user-123');
    expect(updatedUser!.resetPasswordToken).toBe(result.resetToken);
    expect(updatedUser!.resetPasswordExpiry).toEqual(result.expiresAt);
  });

  it('should throw UserNotFoundError when email does not exist', async () => {
    await expect(
      useCase.execute({ email: 'nonexistent@example.com' }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should generate different tokens for multiple requests', async () => {
    const result1 = await useCase.execute({ email: 'test@example.com' });
    const result2 = await useCase.execute({ email: 'test@example.com' });

    expect(result1.resetToken).not.toBe(result2.resetToken);
  });

  it('should set expiry to approximately 1 hour from now', async () => {
    const before = Date.now();
    const result = await useCase.execute({ email: 'test@example.com' });
    const after = Date.now();

    const expectedExpiry = before + 3600000; // +1 hour
    const actualExpiry = result.expiresAt.getTime();

    expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry);
    expect(actualExpiry).toBeLessThanOrEqual(after + 3600000);
  });
});
```

### 7. Use Case: Reset Password

```typescript
// src/application/use-cases/password/reset-password.use-case.ts

import { UserRepository } from '../../ports/user-repository';
import { PasswordHasher } from '../../ports/password-hasher';
import { InvalidResetTokenError, WeakPasswordError } from './password-errors';

export interface ResetPasswordInput {
  resetToken: string;
  newPassword: string;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    // 1. Buscar usuário por token
    const user = await this.userRepository.findByResetToken(input.resetToken);
    if (!user) {
      throw new InvalidResetTokenError();
    }

    // 2. Validar token (expiry)
    if (!user.isResetTokenValid(input.resetToken)) {
      throw new InvalidResetTokenError();
    }

    // 3. Validar nova senha
    this.validatePassword(input.newPassword);

    // 4. Hash da nova senha
    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);

    // 5. Atualizar senha e limpar token
    const userWithNewPassword = user.changePassword(newPasswordHash);
    const userWithoutToken = userWithNewPassword.clearResetToken();

    // 6. Persistir
    await this.userRepository.save(userWithoutToken);
  }

  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new WeakPasswordError('Senha deve ter no mínimo 8 caracteres');
    }

    const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d).+$/.test(password);
    if (!hasLetterAndNumber) {
      throw new WeakPasswordError('Senha deve conter letras e números');
    }
  }
}
```

### 8. Use Case Tests: Reset Password

```typescript
// src/application/use-cases/password/reset-password.use-case.spec.ts

import { ResetPasswordUseCase } from './reset-password.use-case';
import { InMemoryUserRepository } from '../../../infrastructure/database/in-memory-user.repository';
import { User } from '../../../domain/entities/user';
import { InvalidResetTokenError, WeakPasswordError } from './password-errors';

class MockPasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed_${plain}`;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed_${plain}`;
  }
}

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let userRepository: InMemoryUserRepository;
  let passwordHasher: MockPasswordHasher;
  let testUser: User;
  const validToken = 'valid-reset-token-123';

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new MockPasswordHasher();
    useCase = new ResetPasswordUseCase(userRepository, passwordHasher);

    // Setup user with valid reset token
    const futureExpiry = new Date(Date.now() + 3600000); // +1 hora
    testUser = new User(
      'user-123',
      'Test User',
      'test@example.com',
      'hashed_OldPassword123',
      'USER',
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      validToken,
      futureExpiry,
    );

    await userRepository.save(testUser);
  });

  it('should reset password successfully', async () => {
    await useCase.execute({
      resetToken: validToken,
      newPassword: 'NewPassword456',
    });

    const updatedUser = await userRepository.findById('user-123');
    expect(updatedUser!.passwordHash).toBe('hashed_NewPassword456');
  });

  it('should clear reset token after successful reset', async () => {
    await useCase.execute({
      resetToken: validToken,
      newPassword: 'NewPassword456',
    });

    const updatedUser = await userRepository.findById('user-123');
    expect(updatedUser!.resetPasswordToken).toBeNull();
    expect(updatedUser!.resetPasswordExpiry).toBeNull();
  });

  it('should throw InvalidResetTokenError when token does not exist', async () => {
    await expect(
      useCase.execute({
        resetToken: 'invalid-token',
        newPassword: 'NewPassword456',
      }),
    ).rejects.toThrow(InvalidResetTokenError);
  });

  it('should throw InvalidResetTokenError when token is expired', async () => {
    const pastExpiry = new Date(Date.now() - 3600000); // -1 hora
    const expiredUser = testUser.setResetToken(validToken, pastExpiry);
    await userRepository.save(expiredUser);

    await expect(
      useCase.execute({
        resetToken: validToken,
        newPassword: 'NewPassword456',
      }),
    ).rejects.toThrow(InvalidResetTokenError);
  });

  it('should throw WeakPasswordError when password is too short', async () => {
    await expect(
      useCase.execute({
        resetToken: validToken,
        newPassword: 'short',
      }),
    ).rejects.toThrow(WeakPasswordError);
  });

  it('should throw WeakPasswordError when password has no numbers', async () => {
    await expect(
      useCase.execute({
        resetToken: validToken,
        newPassword: 'OnlyLetters',
      }),
    ).rejects.toThrow(WeakPasswordError);
  });
});
```

---

## 🔌 Infrastructure Layer

### Update Prisma Repository

```typescript
// src/infrastructure/database/prisma-user.repository.ts (ADICIONAR método)

export class PrismaUserRepository implements UserRepository {
  // ... métodos existentes ...

  async findByResetToken(token: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { resetPasswordToken: token },
    });

    return user ? this.toDomain(user) : null;
  }

  private toDomain(user: PrismaUser): User {
    return new User(
      user.id,
      user.nome,
      user.email,
      user.passwordHash,
      user.role,
      user.createdAt,
      user.updatedAt,
      user.phone,
      user.avatar,
      user.userRole,
      user.refreshToken,
      user.resetPasswordToken, // 🆕
      user.resetPasswordExpiry, // 🆕
    );
  }
}
```

### Update InMemory Repository (for tests)

```typescript
// src/infrastructure/database/in-memory-user.repository.ts (ADICIONAR método)

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  // ... métodos existentes ...

  async findByResetToken(token: string): Promise<User | null> {
    return this.users.find(u => u.resetPasswordToken === token) || null;
  }
}
```

---

## 🌐 Interface Layer (HTTP)

### 1. DTOs

```typescript
// src/auth/dto/change-password.dto.ts

import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'OldPassword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha (mínimo 8 caracteres, com letras e números)',
    example: 'NewPassword456',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
```

```typescript
// src/auth/dto/request-password-reset.dto.ts

import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}

export class RequestPasswordResetResponseDto {
  @ApiProperty({
    description: 'Token de reset (temporário - até implementar envio de email)',
    example: 'abc123def456...',
  })
  resetToken: string;

  @ApiProperty({
    description: 'Data de expiração do token',
    example: '2026-02-13T15:30:00Z',
  })
  expiresAt: Date;
}
```

```typescript
// src/auth/dto/reset-password.dto.ts

import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de reset recebido',
    example: 'abc123def456...',
  })
  @IsString()
  resetToken: string;

  @ApiProperty({
    description: 'Nova senha (mínimo 8 caracteres, com letras e números)',
    example: 'NewSecurePassword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
```

### 2. Update Auth Controller

```typescript
// src/auth/auth.controller.ts (ADICIONAR endpoints)

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ... endpoints existentes (login, register, refresh) ...

  // 🆕 ENDPOINT 1: Change Password (autenticado)
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mudar senha',
    description: 'Usuário autenticado altera sua própria senha',
  })
  @ApiResponse({ status: 204, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 400, description: 'Senha atual incorreta ou nova senha inválida' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async changePassword(
    @Request() req,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(req.user.userId, dto);
  }

  // 🆕 ENDPOINT ADMIN: Request Password Reset (gera token)
  @Post('admin/request-password-reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[ADMIN] Gerar token de reset de senha',
    description: 'Apenas admins podem gerar tokens de reset (versão simplificada sem email)',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token gerado com sucesso',
    type: RequestPasswordResetResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado ou não é admin' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<RequestPasswordResetResponseDto> {
    return this.authService.requestPasswordReset(dto);
  }

  // 🆕 ENDPOINT 2: Reset Password (público, usa token)
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Resetar senha com token',
    description: 'Redefine senha usando token gerado pelo admin (versão simplificada)',
  })
  @ApiResponse({ status: 204, description: 'Senha resetada com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido, expirado ou senha inválida' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto);
  }
}
```

### 3. Update Auth Service

```typescript
// src/auth/auth.service.ts (ADICIONAR métodos)

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase, // 🆕
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase, // 🆕
    private readonly resetPasswordUseCase: ResetPasswordUseCase, // 🆕
    private readonly jwtService: JwtService,
  ) {}

  // ... métodos existentes ...

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    try {
      await this.changePasswordUseCase.execute({
        userId,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
      });
    } catch (error) {
      if (error instanceof InvalidCurrentPasswordError) {
        throw new BadRequestException('Senha atual incorreta');
      }
      if (error instanceof WeakPasswordError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof PasswordsMatchError) {
        throw new BadRequestException('A nova senha deve ser diferente da atual');
      }
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException('Usuário não encontrado');
      }
      throw error;
    }
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    try {
      const result = await this.requestPasswordResetUseCase.execute({
        email: dto.email,
      });

      return {
        resetToken: result.resetToken,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException('Usuário não encontrado');
      }
      throw error;
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    try {
      await this.resetPasswordUseCase.execute({
        resetToken: dto.resetToken,
        newPassword: dto.newPassword,
      });
    } catch (error) {
      if (error instanceof InvalidResetTokenError) {
        throw new BadRequestException('Token inválido ou expirado');
      }
      if (error instanceof WeakPasswordError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
```

### 4. Update Auth Module

```typescript
// src/auth/auth.module.ts (ADICIONAR providers)

import { ChangePasswordUseCase } from '../application/use-cases/password/change-password.use-case';
import { RequestPasswordResetUseCase } from '../application/use-cases/password/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/password/reset-password.use-case';

@Module({
  imports: [
    DatabaseModule,
    BcryptModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '15m' },
    }),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // ... providers existentes ...
    
    // 🆕 Use cases de password
    {
      provide: ChangePasswordUseCase,
      useFactory: (repo: UserRepository, hasher: PasswordHasher) =>
        new ChangePasswordUseCase(repo, hasher),
      inject: [USER_REPOSITORY, 'HASHER'],
    },
    {
      provide: RequestPasswordResetUseCase,
      useFactory: (repo: UserRepository) =>
        new RequestPasswordResetUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: ResetPasswordUseCase,
      useFactory: (repo: UserRepository, hasher: PasswordHasher) =>
        new ResetPasswordUseCase(repo, hasher),
      inject: [USER_REPOSITORY, 'HASHER'],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 🧪 E2E Tests

```typescript
// test/password-management.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Password Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Limpar database
    await prisma.user.deleteMany();

    // Criar admin
    const adminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'Admin123',
        role: 'cliente',
      });

    // Promover a ADMIN manualmente
    await prisma.user.update({
      where: { email: 'admin@test.com' },
      data: { role: 'ADMIN' },
    });

    // Login como admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin123' });

    adminToken = adminLogin.body.access_token;

    // Criar usuário normal
    const userRes = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Normal User',
        email: 'user@test.com',
        password: 'User123',
        role: 'cliente',
      });

    // Login como user
    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'User123' });

    userToken = userLogin.body.access_token;
    userId = userLogin.body.user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /auth/change-password', () => {
    it('should change password successfully when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'User123',
          newPassword: 'NewUser456',
        });

      expect(response.status).toBe(204);

      // Verificar que pode fazer login com nova senha
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'NewUser456' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.access_token).toBeDefined();
    });

    it('should reject when current password is wrong', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewUser789',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Senha atual incorreta');
    });

    it('should reject when new password is weak', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'NewUser456',
          newPassword: 'weak',
        });

      expect(response.status).toBe(400);
    });

    it('should reject when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .send({
          currentPassword: 'NewUser456',
          newPassword: 'AnotherPassword123',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/admin/request-password-reset', () => {
    it('should generate reset token when admin requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/admin/request-password-reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'user@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.resetToken).toBeDefined();
      expect(response.body.resetToken).toHaveLength(64);
      expect(response.body.expiresAt).toBeDefined();
    });

    it('should reject when non-admin tries to request', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/admin/request-password-reset')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'user@test.com' });

      expect(response.status).toBe(403);
    });

    it('should reject when user not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/admin/request-password-reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'nonexistent@test.com' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Gerar token de reset
      const tokenRes = await request(app.getHttpServer())
        .post('/auth/admin/request-password-reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'user@test.com' });

      resetToken = tokenRes.body.resetToken;
    });

    it('should reset password successfully with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'ResetPassword123',
        });

      expect(response.status).toBe(204);

      // Verificar que pode fazer login com nova senha
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'ResetPassword123' });

      expect(loginRes.status).toBe(200);
    });

    it('should reject when token is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          resetToken: 'invalid-token',
          newPassword: 'NewPassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Token inválido');
    });

    it('should reject when new password is weak', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'weak',
        });

      expect(response.status).toBe(400);
    });

    it('should reject when token is already used', async () => {
      // Primeiro reset
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'FirstReset123',
        });

      // Tentar usar mesmo token novamente
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'SecondReset123',
        });

      expect(response.status).toBe(400);
    });
  });
});
```

---

## 📝 Checklist de Implementação (TDD)

### Phase 1: Domain & Application (RED → GREEN → REFACTOR)

- [ ] **1.1** Migration: Add `resetPasswordToken` and `resetPasswordExpiry` to User model
  ```bash
  npx prisma migrate dev --name add_password_reset_fields
  ```

- [ ] **1.2** Domain Entity Tests (RED)
  - [ ] Write tests for `changePassword()` method
  - [ ] Write tests for `setResetToken()` method
  - [ ] Write tests for `clearResetToken()` method
  - [ ] Write tests for `isResetTokenValid()` method

- [ ] **1.3** Domain Entity Implementation (GREEN)
  - [ ] Implement `changePassword()` in User entity
  - [ ] Implement `setResetToken()` in User entity
  - [ ] Implement `clearResetToken()` in User entity
  - [ ] Implement `isResetTokenValid()` in User entity
  - [ ] Run: `npm test src/domain/entities/user.spec.ts`

- [ ] **1.4** Application Layer Tests (RED)
  - [ ] Create `password-errors.ts`
  - [ ] Write `change-password.use-case.spec.ts` (8 tests)
  - [ ] Write `request-password-reset.use-case.spec.ts` (5 tests)
  - [ ] Write `reset-password.use-case.spec.ts` (6 tests)

- [ ] **1.5** Application Layer Implementation (GREEN)
  - [ ] Implement `ChangePasswordUseCase`
  - [ ] Implement `RequestPasswordResetUseCase`
  - [ ] Implement `ResetPasswordUseCase`
  - [ ] Run: `npm test src/application/use-cases/password/`

### Phase 2: Infrastructure

- [ ] **2.1** Update Repository Port
  - [ ] Add `findByResetToken()` to `UserRepository` interface

- [ ] **2.2** Update Prisma Repository
  - [ ] Implement `findByResetToken()` in PrismaUserRepository
  - [ ] Update `toDomain()` mapper to include reset fields

- [ ] **2.3** Update InMemory Repository (for tests)
  - [ ] Implement `findByResetToken()` in InMemoryUserRepository

- [ ] **2.4** Run Unit Tests
  ```bash
  npm test -- --coverage --testPathPattern="use-cases/password"
  ```

### Phase 3: Interface Layer

- [ ] **3.1** Create DTOs
  - [ ] Create `change-password.dto.ts`
  - [ ] Create `request-password-reset.dto.ts`
  - [ ] Create `reset-password.dto.ts`

- [ ] **3.2** Update Auth Service
  - [ ] Add `changePassword()` method
  - [ ] Add `requestPasswordReset()` method
  - [ ] Add `resetPassword()` method

- [ ] **3.3** Update Auth Controller
  - [ ] Add `POST /auth/change-password` endpoint
  - [ ] Add `POST /auth/admin/request-password-reset` endpoint
  - [ ] Add `POST /auth/reset-password` endpoint

- [ ] **3.4** Update Auth Module
  - [ ] Add providers for 3 new use cases

### Phase 4: E2E Tests

- [ ] **4.1** Create E2E Test File
  - [ ] Write `password-management.e2e-spec.ts`
  - [ ] Setup: Create admin + user
  - [ ] Tests for `change-password` (4 tests)
  - [ ] Tests for `admin/request-password-reset` (3 tests)
  - [ ] Tests for `reset-password` (4 tests)

- [ ] **4.2** Run E2E Tests
  ```bash
  npm run test:e2e -- password-management.e2e-spec.ts
  ```

### Phase 5: Documentation & Final

- [ ] **5.1** Update Swagger Documentation
  - [ ] Verify all DTOs have proper `@ApiProperty`
  - [ ] Verify all endpoints have `@ApiOperation` and `@ApiResponse`

- [ ] **5.2** Run Full Test Suite
  ```bash
  npm test -- --coverage
  npm run test:e2e
  ```

- [ ] **5.3** Verify Coverage
  - [ ] Coverage should remain >70%
  - [ ] All new use cases should have 100% coverage

- [ ] **5.4** Manual Testing
  - [ ] Test via Swagger UI at `http://localhost:3000/docs`
  - [ ] Test change-password flow
  - [ ] Test forgot-password flow

---

## 🚀 Commands para Desenvolvimento

```bash
# 1. Criar migration
npx prisma migrate dev --name add_password_reset_fields

# 2. Rodar testes unitários (TDD)
npm test -- --watch src/domain/entities/user.spec.ts
npm test -- --watch src/application/use-cases/password/

# 3. Rodar testes com coverage
npm test -- --coverage --testPathPattern="password"

# 4. Rodar E2E
npm run test:e2e -- password-management.e2e-spec.ts

# 5. Verificar Swagger
npm run start:dev
# Abrir: http://localhost:3000/docs
```

---

## 🔐 Regras de Segurança

### Validação de Senha
- **Mínimo**: 8 caracteres
- **Obrigatório**: Pelo menos 1 letra E 1 número
- **Pattern**: `/^(?=.*[A-Za-z])(?=.*\d).+$/`

### Token de Reset
- **Geração**: `crypto.randomBytes(32).toString('hex')` (64 chars)
- **Expiração**: 1 hora
- **Uso único**: Token é limpo após reset bem-sucedido
- **Validação**: Token + expiry verificados antes de reset

### Rate Limiting (Futuro)
⚠️ **Recomendação**: Adicionar rate limiting nos endpoints de reset de senha para prevenir ataques de força bruta.

---

## 🔄 Migration Path (Futuro com E-mail)

Quando implementar envio de e-mail:

1. **Criar serviço de e-mail**:
   - Implementar `EmailService` com template de reset
   - Configurar SMTP ou serviço de e-mail (SendGrid, SES, etc.)

2. **Atualizar RequestPasswordResetUseCase**:
   ```typescript
   // Ao invés de retornar token, enviar por email
   await this.emailService.sendPasswordResetEmail(user.email, resetToken);
   
   // Retornar apenas mensagem de sucesso
   return { message: 'Email de recuperação enviado' };
   ```

3. **Remover endpoint admin**:
   - Remover `POST /auth/admin/request-password-reset`
   - Tornar `POST /auth/forgot-password` público

4. **Frontend**:
   - User clica "Esqueci minha senha"
   - Recebe email com link: `https://app.com/reset-password?token=xxx`
   - Frontend chama `POST /auth/reset-password` com token recebido

---

## 📊 Métricas de Sucesso

- ✅ **Coverage**: ≥70% geral (target 100% para use cases)
- ✅ **Testes**: ~27 testes (8 domain + 19 use cases + E2E)
- ✅ **Performance**: Endpoints respondem em <500ms
- ✅ **Security**: Senhas validadas, tokens seguros, expiry funcionando

---

## 🎯 Resumo para o Dev

### Endpoints Finais

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/auth/change-password` | ✅ JWT | Mudar senha (autenticado) |
| `POST` | `/auth/admin/request-password-reset` | ✅ JWT + Admin | Gerar token de reset (temp) |
| `POST` | `/auth/reset-password` | ❌ Público | Resetar senha com token |

### Fluxo Simplificado (Sem E-mail)

**Cenário 1: Usuário autenticado muda senha**
```
1. User faz POST /auth/change-password com JWT
2. Informa senha atual + nova senha
3. Sistema valida e atualiza
```

**Cenário 2: Usuário esqueceu senha**
```
1. Admin faz POST /auth/admin/request-password-reset
2. Admin recebe token e repassa para usuário (fora do sistema)
3. User faz POST /auth/reset-password com token + nova senha
4. Sistema valida token e atualiza senha
```

### O que NÃO fazer
- ❌ Retornar token de reset em resposta pública
- ❌ Permitir reutilização de token
- ❌ Aceitar senhas fracas
- ❌ Esquecer de limpar token após uso

---

**Próximos Passos**: Seguir checklist de implementação em ordem (TDD)
