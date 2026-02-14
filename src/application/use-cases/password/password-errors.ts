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
