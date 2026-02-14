export class EmailAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Email already exists: ${email}`);
    this.name = 'EmailAlreadyExistsError';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('Usuário não encontrado');
    this.name = 'UserNotFoundError';
  }
}

